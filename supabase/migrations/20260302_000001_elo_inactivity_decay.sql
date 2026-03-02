-- Retroactive inactivity decay for ELO
-- Rules:
-- - Grace period: 14 days
-- - Penalty: 10 ELO per inactive week
-- - Floor: 800

create or replace function get_player_elo_before_with_decay(
  p_player_id uuid,
  p_match_id uuid,
  p_grace_days integer default 14,
  p_weekly_penalty integer default 10,
  p_floor integer default 800
)
returns integer as $$
declare
  v_prev_rating integer;
  v_prev_played_at timestamptz;
  v_current_played_at timestamptz;
  v_inactive_days integer;
  v_decay_days integer;
  v_inactive_weeks integer;
  v_decayed integer;
begin
  select m.played_at into v_current_played_at
  from matches m
  where m.id = p_match_id;

  if v_current_played_at is null then
    return 1000;
  end if;

  select er.rating, pm.played_at
    into v_prev_rating, v_prev_played_at
  from elo_ratings er
  join matches pm on pm.id = er.as_of_match_id
  where er.player_id = p_player_id
    and (
      pm.played_at < v_current_played_at or
      (pm.played_at = v_current_played_at and pm.created_at < (select created_at from matches where id = p_match_id))
    )
  order by pm.played_at desc, pm.created_at desc
  limit 1;

  if v_prev_rating is null then
    return 1000;
  end if;

  if v_prev_played_at is null then
    return greatest(p_floor, v_prev_rating);
  end if;

  v_inactive_days := floor(extract(epoch from (v_current_played_at - v_prev_played_at)) / 86400.0);
  v_decay_days := v_inactive_days - p_grace_days;

  if v_decay_days <= 0 then
    return v_prev_rating;
  end if;

  v_inactive_weeks := floor(v_decay_days / 7.0);

  if v_inactive_weeks <= 0 then
    return v_prev_rating;
  end if;

  v_decayed := v_prev_rating - (v_inactive_weeks * p_weekly_penalty);
  return greatest(p_floor, v_decayed);
end;
$$ language plpgsql security definer set search_path = public;

create or replace function apply_match_elo(p_match_id uuid, p_k integer default 32)
returns void as $$
declare
  v_team1_avg numeric;
  v_team2_avg numeric;
  v_expected_team1 numeric;
  v_expected_team2 numeric;
  v_team1_win boolean;
  v_team2_win boolean;
  v_team1_ids uuid[];
  v_team2_ids uuid[];
  v_player_id uuid;
  v_old integer;
  v_new integer;
  v_team1_sets int := 0;
  v_team2_sets int := 0;
  v_team1_games int := 0;
  v_team2_games int := 0;
  v_set_diff int := 0;
  v_game_diff int := 0;
  v_margin numeric := 1.0;
  v_adj_k numeric;
begin
  if not is_match_complete(p_match_id) then
    return;
  end if;

  delete from elo_ratings where as_of_match_id = p_match_id;

  select array_agg(mtp.player_id order by mtp.player_id)
    into v_team1_ids
  from match_teams mt
  join match_team_players mtp on mtp.match_team_id = mt.id
  where mt.match_id = p_match_id and mt.team_number = 1;

  select array_agg(mtp.player_id order by mtp.player_id)
    into v_team2_ids
  from match_teams mt
  join match_team_players mtp on mtp.match_team_id = mt.id
  where mt.match_id = p_match_id and mt.team_number = 2;

  if v_team1_ids is null or array_length(v_team1_ids, 1) <> 2 then
    return;
  end if;
  if v_team2_ids is null or array_length(v_team2_ids, 1) <> 2 then
    return;
  end if;

  select (
      get_player_elo_before_with_decay(v_team1_ids[1], p_match_id, 14, 10, 800)
      + get_player_elo_before_with_decay(v_team1_ids[2], p_match_id, 14, 10, 800)
    ) / 2.0
    into v_team1_avg;
  select (
      get_player_elo_before_with_decay(v_team2_ids[1], p_match_id, 14, 10, 800)
      + get_player_elo_before_with_decay(v_team2_ids[2], p_match_id, 14, 10, 800)
    ) / 2.0
    into v_team2_avg;

  v_expected_team1 := 1 / (1 + power(10, (v_team2_avg - v_team1_avg) / 400.0));
  v_expected_team2 := 1 - v_expected_team1;

  select (mw.team_number = 1), (mw.team_number = 2)
    into v_team1_win, v_team2_win
  from v_match_winners mw
  where mw.match_id = p_match_id
  limit 1;

  select
    sum(case when ss.team1_games > ss.team2_games then 1 else 0 end),
    sum(case when ss.team2_games > ss.team1_games then 1 else 0 end),
    sum(ss.team1_games),
    sum(ss.team2_games)
  into v_team1_sets, v_team2_sets, v_team1_games, v_team2_games
  from sets s
  join set_scores ss on ss.set_id = s.id
  where s.match_id = p_match_id;

  v_set_diff := abs(v_team1_sets - v_team2_sets);
  v_game_diff := abs(v_team1_games - v_team2_games);

  v_margin := 1 + (v_set_diff * 0.20) + (v_game_diff * 0.02);
  if v_margin > 1.6 then
    v_margin := 1.6;
  end if;

  v_adj_k := p_k * v_margin;

  foreach v_player_id in array v_team1_ids loop
    v_old := get_player_elo_before_with_decay(v_player_id, p_match_id, 14, 10, 800);
    v_new := round(v_old + v_adj_k * ((case when v_team1_win then 1 else 0 end) - v_expected_team1));
    insert into elo_ratings(player_id, rating, as_of_match_id)
    values (v_player_id, v_new, p_match_id);
  end loop;

  foreach v_player_id in array v_team2_ids loop
    v_old := get_player_elo_before_with_decay(v_player_id, p_match_id, 14, 10, 800);
    v_new := round(v_old + v_adj_k * ((case when v_team2_win then 1 else 0 end) - v_expected_team2));
    insert into elo_ratings(player_id, rating, as_of_match_id)
    values (v_player_id, v_new, p_match_id);
  end loop;
end;
$$ language plpgsql security definer set search_path = public;

-- Recompute ELO so existing historical matches receive retroactive inactivity decay.
select recompute_all_elo(32);
