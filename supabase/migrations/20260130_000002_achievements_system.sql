-- Achievements and Badges System
-- Supports achievement definitions, tracking, and evaluation

-- Achievement rarity enum
create type achievement_rarity as enum ('common', 'rare', 'epic', 'legendary');

-- Achievement definitions (seeded data for all achievements)
create table achievement_definitions (
  key text primary key,
  name text not null,
  description text not null,
  rarity achievement_rarity not null,
  category text not null, -- 'matches', 'streaks', 'elo', 'rankings', 'special'
  icon text not null, -- emoji or icon identifier
  achievement_order integer not null, -- for sorting within rarity
  -- Achievement criteria (stored as JSON for flexibility)
  criteria jsonb not null
);

-- Achievements unlocked by players
create table achievements (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  achievement_key text not null references achievement_definitions(key) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique(player_id, achievement_key)
);

-- Indexes for performance
create index idx_achievements_player on achievements(player_id);
create index idx_achievements_key on achievements(achievement_key);
create index idx_achievements_player_key on achievements(player_id, achievement_key);
create index idx_achievement_definitions_category on achievement_definitions(category);

-- Function to update player updated_at when achievement is unlocked
create or replace function update_player_updated_on_achievement()
returns trigger as $$
begin
  update players set updated_at = now() where id = new.player_id;
  return new;
end;
$$ language plpgsql;

-- Trigger to update player updated_at when achievement is unlocked
create trigger player_updated_on_achievement
after insert on achievements
for each row
execute function update_player_updated_on_achievement();

-- Function: Get player's current stats for achievement evaluation
create or replace function get_player_stats(p_group_id uuid, p_player_id uuid)
returns jsonb as $$
declare
  v_matches_played int;
  v_win_streak int;
  v_current_elo int;
  v_max_elo int;
  v_best_ranking int;
  v_sets_played int;
  v_monthly_matches int;
  v_latest_month_matches int;
begin
  -- Total matches played
  select count(*) into v_matches_played
  from v_player_match_results pmr
  join matches m on m.id = pmr.match_id
  where pmr.player_id = p_player_id and m.group_id = p_group_id;

  -- Current win streak (consecutive wins from most recent match)
  with ranked_matches as (
    select
      pmr.is_win,
      row_number() over (order by m.played_at desc, m.created_at desc) as rn
    from v_player_match_results pmr
    join matches m on m.id = pmr.match_id
    where pmr.player_id = p_player_id and m.group_id = p_group_id
  ),
  streak_data as (
    select
      is_win,
      case
        when not is_win then 0
        when lag(is_win) over (order by rn) = false then 1
        when lag(is_win) over (order by rn) = true then lead(streak_count) over (order by rn) + 1
        else 1
      end as streak_count
    from ranked_matches
  )
  select coalesce(max(streak_count) filter (where is_win = true), 0) into v_win_streak
  from streak_data;

  -- Current ELO rating
  select er.rating into v_current_elo
  from elo_ratings er
  join matches m on m.id = er.as_of_match_id
  where er.player_id = p_player_id and m.group_id = p_group_id
  order by m.played_at desc, m.created_at desc
  limit 1;

  v_current_elo := coalesce(v_current_elo, 1000);

  -- Max ELO achieved
  select max(er.rating) into v_max_elo
  from elo_ratings er
  join matches m on m.id = er.as_of_match_id
  where er.player_id = p_player_id and m.group_id = p_group_id;

  -- Best ranking (lowest position)
  -- Using a simple approach: rank by ELO within the group
  with player_elos as (
    select
      er.player_id,
      er.rating,
      row_number() over (order by er.rating desc) as ranking
    from elo_ratings er
    join (
      -- Get latest ELO for each player
      select distinct on (er2.player_id)
        er2.player_id,
        er2.rating
      from elo_ratings er2
      join matches m2 on m2.id = er2.as_of_match_id
      where m2.group_id = p_group_id
      order by er2.player_id, m2.played_at desc, m2.created_at desc
    ) latest on latest.player_id = er.player_id
    where latest.player_id = er.player_id
  )
  select min(ranking) into v_best_ranking
  from player_elos
  where player_id = p_player_id;

  -- Total sets played
  select count(*) into v_sets_played
  from v_player_match_results pmr
  join matches m on m.id = pmr.match_id
  join sets s on s.match_id = m.id
  where pmr.player_id = p_player_id and m.group_id = p_group_id;

  -- Monthly matches (current month)
  select count(*) into v_monthly_matches
  from v_player_match_results pmr
  join matches m on m.id = pmr.match_id
  where pmr.player_id = p_player_id
    and m.group_id = p_group_id
    and date_trunc('month', m.played_at) = date_trunc('month', now());

  -- Check for special achievements
  -- Comeback King: Win a match after losing first 2 sets (best of 5)
  -- or after losing first set (best of 3)
  -- Perfect Set: Win a set 6-0
  -- Marathon Match: Win a match 2-1 (3 sets) after losing first set

  return jsonb_build_object(
    'matches_played', v_matches_played,
    'win_streak', v_win_streak,
    'current_elo', v_current_elo,
    'max_elo', v_max_elo,
    'best_ranking', v_best_ranking,
    'sets_played', v_sets_played,
    'monthly_matches', v_monthly_matches,
    'player_id', p_player_id,
    'group_id', p_group_id
  );
end;
$$ language plpgsql;

-- Function: Check achievements for a player and unlock newly completed ones
create or replace function check_achievements(p_group_id uuid, p_player_id uuid)
returns jsonb as $$
declare
  v_stats jsonb;
  v_achievement record;
  v_criteria jsonb;
  v_unlocked_keys text[];
  v_new_unlocks text[] := '{}';
  v_should_unlock boolean;
begin
  -- Get current player stats
  v_stats := get_player_stats(p_group_id, p_player_id);

  -- Get already unlocked achievements
  select array_agg(achievement_key) into v_unlocked_keys
  from achievements
  where player_id = p_player_id;

  v_unlocked_keys := coalesce(v_unlocked_keys, '{}');

  -- Check each achievement definition
  for v_achievement in select * from achievement_definitions order by achievement_order loop
    -- Skip if already unlocked
    if v_achievement.key = any(v_unlocked_keys) then
      continue;
    end if;

    v_criteria := v_achievement.criteria;
    v_should_unlock := false;

    -- Evaluate based on category
    case v_achievement.category
      when 'matches' then
        if (v_stats->>'matches_played')::int >= (v_criteria->>'matches_required')::int then
          v_should_unlock := true;
        end if;

      when 'streaks' then
        if (v_stats->>'win_streak')::int >= (v_criteria->>'streak_required')::int then
          v_should_unlock := true;
        end if;

      when 'elo' then
        if (v_stats->>'max_elo')::int >= (v_criteria->>'elo_required')::int then
          v_should_unlock := true;
        end if;

      when 'rankings' then
        if v_stats->>'best_ranking' is not null and
           (v_stats->>'best_ranking')::int <= (v_criteria->>'ranking_required')::int then
          v_should_unlock := true;
        end if;

      when 'special' then
        -- Special achievements require match-by-match analysis
        -- This is handled by a separate function
        continue;
    end case;

    -- Unlock if criteria met
    if v_should_unlock then
      insert into achievements (player_id, achievement_key)
      values (p_player_id, v_achievement.key);
      v_new_unlocks := array_append(v_new_unlocks, v_achievement.key);
    end if;
  end loop;

  return jsonb_build_object(
    'player_id', p_player_id,
    'new_unlocks', v_new_unlocks,
    'total_new', array_length(v_new_unlocks, 1)
  );
end;
$$ language plpgsql;

-- Function: Check special achievements that require match-level analysis
create or replace function check_special_achievements(p_group_id uuid, p_player_id uuid)
returns jsonb as $$
declare
  v_new_unlocks text[] := '{}';
  v_comeback_king boolean;
  v_perfect_set boolean;
  v_marathon_match boolean;
begin
  -- Check Comeback King: Win after losing first set(s)
  select exists(
    select 1
    from matches m
    join match_teams mt on mt.match_id = m.id
    join match_team_players mtp on mtp.match_team_id = mt.id
    join v_match_winners mw on mw.match_id = m.id
    where m.group_id = p_group_id
      and mtp.player_id = p_player_id
      and mw.team_number = mt.team_number
      and (
        -- Best of 5: lost first 2 sets, won match
        (m.best_of = 5 and exists(
          select 1
          from sets s
          join set_scores ss on ss.set_id = s.id
          where s.match_id = m.id
            and s.set_number <= 2
            and (
              (mt.team_number = 1 and ss.team2_games > ss.team1_games) or
              (mt.team_number = 2 and ss.team1_games > ss.team2_games)
            )
        )) or
        -- Best of 3: lost first set, won match
        (m.best_of = 3 and exists(
          select 1
          from sets s
          join set_scores ss on ss.set_id = s.id
          where s.match_id = m.id
            and s.set_number = 1
            and (
              (mt.team_number = 1 and ss.team2_games > ss.team1_games) or
              (mt.team_number = 2 and ss.team1_games > ss.team2_games)
            )
        ))
      )
  ) into v_comeback_king;

  -- Check Perfect Set: Win a set 6-0
  select exists(
    select 1
    from matches m
    join match_teams mt on mt.match_id = m.id
    join match_team_players mtp on mtp.match_team_id = mt.id
    join sets s on s.match_id = m.id
    join set_scores ss on ss.set_id = s.id
    where m.group_id = p_group_id
      and mtp.player_id = p_player_id
      and (
        (mt.team_number = 1 and ss.team1_games = 6 and ss.team2_games = 0) or
        (mt.team_number = 2 and ss.team2_games = 6 and ss.team1_games = 0)
      )
  ) into v_perfect_set;

  -- Check Marathon Match: Win 2-1 after losing first set
  select exists(
    select 1
    from matches m
    join match_teams mt on mt.match_id = m.id
    join match_team_players mtp on mtp.match_team_id = mt.id
    join v_match_winners mw on mw.match_id = m.id
    where m.group_id = p_group_id
      and m.best_of = 3
      and mtp.player_id = p_player_id
      and mw.team_number = mt.team_number
      and exists(
        select 1
        from sets s
        join set_scores ss on ss.set_id = s.id
        where s.match_id = m.id
          and s.set_number = 1
          and (
            (mt.team_number = 1 and ss.team2_games > ss.team1_games) or
            (mt.team_number = 2 and ss.team1_games > ss.team2_games)
          )
      )
      and exists(
        select 1
        from v_match_team_set_wins sw
        where sw.match_id = m.id
        group by match_id
        having max(sets_won) = 2
      )
  ) into v_marathon_match;

  -- Unlock if criteria met and not already unlocked
  if v_comeback_king and not exists(
    select 1 from achievements where player_id = p_player_id and achievement_key = 'comeback_king'
  ) then
    insert into achievements (player_id, achievement_key) values (p_player_id, 'comeback_king');
    v_new_unlocks := array_append(v_new_unlocks, 'comeback_king');
  end if;

  if v_perfect_set and not exists(
    select 1 from achievements where player_id = p_player_id and achievement_key = 'perfect_set'
  ) then
    insert into achievements (player_id, achievement_key) values (p_player_id, 'perfect_set');
    v_new_unlocks := array_append(v_new_unlocks, 'perfect_set');
  end if;

  if v_marathon_match and not exists(
    select 1 from achievements where player_id = p_player_id and achievement_key = 'marathon_match'
  ) then
    insert into achievements (player_id, achievement_key) values (p_player_id, 'marathon_match');
    v_new_unlocks := array_append(v_new_unlocks, 'marathon_match');
  end if;

  -- Check Iron Player: Play 20 matches in a single month
  if exists(
    select 1 from (
      select count(*)::int as matches_count
      from matches m
      join match_teams mt on mt.match_id = m.id
      join match_team_players mtp on mtp.match_team_id = mt.id
      where m.group_id = p_group_id
        and mtp.player_id = p_player_id
      group by date_trunc('month', m.played_at)
    ) monthly_counts where matches_count >= 20
  ) and not exists(
    select 1 from achievements where player_id = p_player_id and achievement_key = 'iron_player'
  ) then
    insert into achievements (player_id, achievement_key) values (p_player_id, 'iron_player');
    v_new_unlocks := array_append(v_new_unlocks, 'iron_player');
  end if;

  return jsonb_build_object(
    'player_id', p_player_id,
    'new_unlocks', v_new_unlocks,
    'total_new', array_length(v_new_unlocks, 1)
  );
end;
$$ language plpgsql;

-- Function: Get all achievements for a player (unlocked + locked with progress)
create or replace function get_player_achievements(p_group_id uuid, p_player_id uuid)
returns jsonb as $$
declare
  v_stats jsonb;
  v_result jsonb := jsonb_build_object('unlocked', '[]', 'locked', '[]');
  v_achievement record;
  v_unlocked_keys text[];
  v_unlocked_list jsonb := '[]';
  v_locked_list jsonb := '[]';
  v_progress jsonb;
  v_progress_percent numeric;
  v_matches_required int;
  v_streak_required int;
  v_elo_required int;
  v_ranking_required int;
  v_achievements_count int;
  v_best_ranking int;
begin
  -- Get current player stats
  v_stats := get_player_stats(p_group_id, p_player_id);

  -- Get unlocked achievements with details
  for v_achievement in
    select
      a.unlocked_at,
      ad.key,
      ad.name,
      ad.description,
      ad.rarity,
      ad.category,
      ad.icon
    from achievements a
    join achievement_definitions ad on ad.key = a.achievement_key
    where a.player_id = p_player_id
    order by
      case ad.rarity
        when 'legendary' then 1
        when 'epic' then 2
        when 'rare' then 3
        when 'common' then 4
      end,
      ad.achievement_order
  loop
    v_unlocked_list := v_unlocked_list || jsonb_build_object(
      'key', v_achievement.key,
      'name', v_achievement.name,
      'description', v_achievement.description,
      'rarity', v_achievement.rarity,
      'category', v_achievement.category,
      'icon', v_achievement.icon,
      'unlocked_at', v_achievement.unlocked_at
    );
  end loop;

  v_unlocked_keys := array(select jsonb_array_elements(v_unlocked_list)->>'key');

  -- Get locked achievements with progress
  for v_achievement in
    select *
    from achievement_definitions ad
    where ad.key != all(v_unlocked_keys)
    order by
      case ad.rarity
        when 'legendary' then 1
        when 'epic' then 2
        when 'rare' then 3
        when 'common' then 4
      end,
      ad.achievement_order
  loop
    v_progress := '{}'::jsonb;
    v_progress_percent := 0;

    case v_achievement.category
      when 'matches' then
        v_matches_required := (v_achievement.criteria->>'matches_required')::int;
        v_achievements_count := (v_stats->>'matches_played')::int;
        v_progress := jsonb_build_object('current', v_achievements_count, 'target', v_matches_required);
        v_progress_percent := (v_achievements_count::numeric / v_matches_required::numeric) * 100;

      when 'streaks' then
        v_streak_required := (v_achievement.criteria->>'streak_required')::int;
        v_achievements_count := (v_stats->>'win_streak')::int;
        v_progress := jsonb_build_object('current', v_achievements_count, 'target', v_streak_required);
        v_progress_percent := (v_achievements_count::numeric / v_streak_required::numeric) * 100;

      when 'elo' then
        v_elo_required := (v_achievement.criteria->>'elo_required')::int;
        v_achievements_count := (v_stats->>'max_elo')::int;
        v_progress := jsonb_build_object('current', v_achievements_count, 'target', v_elo_required);
        v_progress_percent := (v_achievements_count::numeric / v_elo_required::numeric) * 100;

      when 'rankings' then
        v_ranking_required := (v_achievement.criteria->>'ranking_required')::int;
        v_best_ranking := (v_stats->>'best_ranking')::int;
        if v_best_ranking is not null then
          v_progress := jsonb_build_object('current', v_best_ranking, 'target', v_ranking_required);
          -- Calculate progress: better ranking = higher progress
          v_progress_percent := case
            when v_best_ranking <= v_ranking_required then 100
            else ((v_ranking_required::numeric - v_best_ranking::numeric + 10) / (v_ranking_required::numeric * 2)) * 100
          end;
          v_progress_percent := least(100, greatest(0, v_progress_percent));
        else
          v_progress := jsonb_build_object('current', null, 'target', v_ranking_required);
        end if;

      when 'special' then
        -- Special achievements don't show progress
        v_progress := jsonb_build_object('current', null, 'target', null);
        v_progress_percent := 0;
    end case;

    v_locked_list := v_locked_list || jsonb_build_object(
      'key', v_achievement.key,
      'name', v_achievement.name,
      'description', v_achievement.description,
      'rarity', v_achievement.rarity,
      'category', v_achievement.category,
      'icon', v_achievement.icon,
      'progress', v_progress,
      'progress_percent', round(v_progress_percent, 1)
    );
  end loop;

  return jsonb_build_object(
    'unlocked', v_unlocked_list,
    'locked', v_locked_list
  );
end;
$$ language plpgsql;

-- Seed achievement definitions
insert into achievement_definitions (key, name, description, rarity, category, icon, achievement_order, criteria) values
-- Matches Played
('matches_played_1', 'First Match', 'Play your first match', 'common', 'matches', '🎯', 1, '{"matches_required": 1}'),
('matches_played_10', 'Regular Player', 'Play 10 matches', 'common', 'matches', '🏓', 2, '{"matches_required": 10}'),
('matches_played_50', 'Veteran', 'Play 50 matches', 'rare', 'matches', '🏅', 3, '{"matches_required": 50}'),
('matches_played_100', 'Centurion', 'Play 100 matches', 'epic', 'matches', '💯', 4, '{"matches_required": 100}'),
('matches_played_250', 'Legend', 'Play 250 matches', 'legendary', 'matches', '👑', 5, '{"matches_required": 250}'),

-- Win Streaks
('streak_3', 'On Fire', 'Win 3 consecutive matches', 'common', 'streaks', '🔥', 1, '{"streak_required": 3}'),
('streak_5', 'Hot Streak', 'Win 5 consecutive matches', 'rare', 'streaks', '💥', 2, '{"streak_required": 5}'),
('streak_10', 'Streak Master', 'Win 10 consecutive matches', 'epic', 'streaks', '⚡', 3, '{"streak_required": 10}'),
('streak_15', 'Unstoppable', 'Win 15 consecutive matches', 'legendary', 'streaks', '🚀', 4, '{"streak_required": 15}'),

-- ELO Milestones
('elo_1100', 'Rated Player', 'Reach 1100 ELO', 'common', 'elo', '📊', 1, '{"elo_required": 1100}'),
('elo_1200', 'Skilled Player', 'Reach 1200 ELO', 'rare', 'elo', '📈', 2, '{"elo_required": 1200}'),
('elo_1300', 'Expert', 'Reach 1300 ELO', 'epic', 'elo', '🎯', 3, '{"elo_required": 1300}'),
('elo_1400', 'Champion', 'Reach 1400 ELO', 'legendary', 'elo', '🏆', 4, '{"elo_required": 1400}'),

-- Rankings
('ranking_10', 'Top 10', 'Reach top 10 in group rankings', 'rare', 'rankings', '🥈', 1, '{"ranking_required": 10}'),
('ranking_5', 'Top 5', 'Reach top 5 in group rankings', 'epic', 'rankings', '🥉', 2, '{"ranking_required": 5}'),
('ranking_1', 'Number One', 'Reach #1 ranking', 'legendary', 'rankings', '🥇', 3, '{"ranking_required": 1}'),

-- Special
('comeback_king', 'Comeback King', 'Win a match after losing the first set', 'epic', 'special', '👑', 1, '{"type": "comeback"}'),
('perfect_set', 'Perfect Set', 'Win a set 6-0', 'rare', 'special', '💎', 2, '{"type": "perfect_set"}'),
('marathon_match', 'Marathon Match', 'Win a 3-set match 2-1 after losing first set', 'epic', 'special', '🏃', 3, '{"type": "marathon"}'),
('iron_player', 'Iron Player', 'Play 20 matches in a single month', 'rare', 'special', '🔩', 4, '{"type": "monthly", "matches_required": 20}');
