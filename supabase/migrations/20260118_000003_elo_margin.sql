-- Ajuste ELO: considerar diferencia de sets y juegos
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

  select (get_player_elo_before(v_team1_ids[1], p_match_id) + get_player_elo_before(v_team1_ids[2], p_match_id)) / 2.0
    into v_team1_avg;
  select (get_player_elo_before(v_team2_ids[1], p_match_id) + get_player_elo_before(v_team2_ids[2], p_match_id)) / 2.0
    into v_team2_avg;

  v_expected_team1 := 1 / (1 + power(10, (v_team2_avg - v_team1_avg) / 400.0));
  v_expected_team2 := 1 - v_expected_team1;

  select (mw.team_number = 1), (mw.team_number = 2)
    into v_team1_win, v_team2_win
  from v_match_winners mw
  where mw.match_id = p_match_id
  limit 1;

  -- Calcular diferencia de sets y juegos
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

  -- Factor de margen: +20% por set de diferencia, +2% por juego de diferencia
  v_margin := 1 + (v_set_diff * 0.20) + (v_game_diff * 0.02);
  if v_margin > 1.6 then
    v_margin := 1.6;
  end if;

  v_adj_k := p_k * v_margin;

  foreach v_player_id in array v_team1_ids loop
    v_old := get_player_elo_before(v_player_id, p_match_id);
    v_new := round(v_old + v_adj_k * ((case when v_team1_win then 1 else 0 end) - v_expected_team1));
    insert into elo_ratings(player_id, rating, as_of_match_id)
    values (v_player_id, v_new, p_match_id);
  end loop;

  foreach v_player_id in array v_team2_ids loop
    v_old := get_player_elo_before(v_player_id, p_match_id);
    v_new := round(v_old + v_adj_k * ((case when v_team2_win then 1 else 0 end) - v_expected_team2));
    insert into elo_ratings(player_id, rating, as_of_match_id)
    values (v_player_id, v_new, p_match_id);
  end loop;
end;
$$ language plpgsql;
