-- Weekly Challenges & Streak Rewards System
-- Gamification layer for weekly objectives, streak tracking, and achievement rewards

-- Challenge type enum
create type challenge_type as enum ('volume', 'performance', 'social');

-- Badge type enum
create type badge_type as enum ('weekly_complete', 'streak_milestone', 'special');

-- Weekly challenge definitions (one per week per group per type)
create table weekly_challenges (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  week_start date not null, -- Monday of the week
  challenge_type challenge_type not null,
  target_value integer not null,
  created_at timestamptz not null default now(),
  unique(group_id, week_start, challenge_type)
);

-- Player weekly progress tracking
create table player_weekly_progress (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  week_start date not null,
  challenges_completed integer not null default 0, -- 0-3
  challenge_volume_completed boolean not null default false,
  challenge_performance_completed boolean not null default false,
  challenge_social_completed boolean not null default false,
  skipped boolean not null default false,
  updated_at timestamptz not null default now(),
  unique(player_id, group_id, week_start)
);

-- Player streaks
create table streaks (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_completed_week date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(player_id, group_id)
);

-- Badge definitions
create table badges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  badge_type badge_type not null,
  milestone_value integer, -- For streak badges: weeks required
  icon text not null, -- Emoji or icon identifier
  display_order integer not null, -- For sorting
  created_at timestamptz not null default now(),
  unique(name, badge_type)
);

-- Player earned badges
create table player_badges (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  badge_id uuid not null references badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique(player_id, badge_id)
);

-- Group settings for weekly challenges
create table group_challenge_settings (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null unique references groups(id) on delete cascade,
  enabled boolean not null default true,
  active_challenge_types challenge_type[] not null default '{volume,performance,social}',
  difficulty_level text not null default 'medium', -- easy, medium, hard
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES (Performance optimization per Supabase best practices)
-- ============================================================

-- weekly_challenges indexes
create index idx_weekly_challenges_group_week on weekly_challenges(group_id, week_start);
create index idx_weekly_challenges_week_start on weekly_challenges(week_start);

-- player_weekly_progress indexes
create index idx_player_weekly_progress_player_group on player_weekly_progress(player_id, group_id);
create index idx_player_weekly_progress_group_week on player_weekly_progress(group_id, week_start);
create index idx_player_weekly_progress_player_week on player_weekly_progress(player_id, week_start);

-- streaks indexes
create index idx_streaks_player_group on streaks(player_id, group_id);
create index idx_streaks_current_streak on streaks(current_streak desc);

-- badges indexes
create index idx_badges_type on badges(badge_type);
create index idx_badges_milestone on badges(badge_type, milestone_value);

-- player_badges indexes
create index idx_player_badges_player on player_badges(player_id);
create index idx_player_badges_badge on player_badges(badge_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function: Get or create weekly challenges for a group
create or replace function get_or_create_weekly_challenges(
  p_group_id uuid,
  p_week_start date
)
returns jsonb as $$
declare
  v_challenge record;
  v_challenges jsonb := '[]'::jsonb;
  v_target_volume int;
  v_target_performance int;
  v_target_social int;
begin
  -- Check if challenges already exist for this week
  if exists(select 1 from weekly_challenges where group_id = p_group_id and week_start = p_week_start) then
    for v_challenge in
      select * from weekly_challenges
      where group_id = p_group_id and week_start = p_week_start
    loop
      v_challenges := v_challenges || jsonb_build_object(
        'type', v_challenge.challenge_type,
        'target', v_challenge.target_value
      );
    end loop;
    return jsonb_build_object('challenges', v_challenges, 'created', false);
  end if;

  -- Calculate adaptive targets based on group activity
  -- Volume: 3-5 matches based on average weekly matches
  select least(5, greatest(3, round(avg_weekly_matches * 1.2))) into v_target_volume
  from (
    select
      count(*)::float / count(distinct date_trunc('week', played_at)) as avg_weekly_matches
    from matches
    where group_id = p_group_id
      and played_at >= now() - interval '4 weeks'
  ) weekly_stats;

  v_target_volume := coalesce(v_target_volume, 3);

  -- Performance: 1-3 wins based on average weekly wins
  select least(3, greatest(1, round(avg_weekly_wins * 1.5))) into v_target_performance
  from (
    select
      sum(case when is_win then 1 else 0 end)::float / count(distinct date_trunc('week', played_at)) as avg_weekly_wins
    from v_player_match_results pmr
    join matches m on m.id = pmr.match_id
    where m.group_id = p_group_id
      and m.played_at >= now() - interval '4 weeks'
  ) weekly_wins;

  v_target_performance := coalesce(v_target_performance, 1);

  -- Social: 2-4 different partners based on unique partnerships
  select least(4, greatest(2, round(unique_partners * 0.3))) into v_target_social
  from (
    select count(distinct
      case when player1_id < player2_id then player1_id || '_' || player2_id
           else player2_id || '_' || player1_id end
    )::float as unique_partners
    from partnerships
    where group_id = p_group_id
      and last_played_at >= now() - interval '4 weeks'
  ) partner_stats;

  v_target_social := coalesce(v_target_social, 2);

  -- Create the 3 challenges
  insert into weekly_challenges (group_id, week_start, challenge_type, target_value)
  values
    (p_group_id, p_week_start, 'volume', v_target_volume),
    (p_group_id, p_week_start, 'performance', v_target_performance),
    (p_group_id, p_week_start, 'social', v_target_social);

  for v_challenge in
    select * from weekly_challenges
    where group_id = p_group_id and week_start = p_week_start
  loop
    v_challenges := v_challenges || jsonb_build_object(
      'type', v_challenge.challenge_type,
      'target', v_challenge.target_value
    );
  end loop;

  return jsonb_build_object('challenges', v_challenges, 'created', true);
end;
$$ language plpgsql;

-- Function: Initialize weekly progress for all active players in a group
create or replace function initialize_weekly_progress(
  p_group_id uuid,
  p_week_start date
)
returns integer as $$
declare
  v_players_inserted int;
begin
  insert into player_weekly_progress (player_id, group_id, week_start)
  select distinct
    mtp.player_id,
    p_group_id,
    p_week_start
  from match_team_players mtp
  join match_teams mt on mt.id = mtp.match_team_id
  join matches m on m.id = mt.match_id
  where m.group_id = p_group_id
    and m.played_at >= now() - interval '30 days'
    and not exists(
      select 1 from player_weekly_progress
      where player_id = mtp.player_id
        and group_id = p_group_id
        and week_start = p_week_start
    );

  get diagnostics v_players_inserted = row_count;
  return v_players_inserted;
end;
$$ language plpgsql;

-- Function: Update player weekly progress after a match
create or replace function update_weekly_progress(
  p_group_id uuid,
  p_match_id uuid
)
returns jsonb as $$
declare
  v_week_start date;
  v_players uuid[];
  v_player_id uuid;
  v_challenge_volume int;
  v_challenge_performance int;
  v_challenge_social int;
  v_volume_progress int;
  v_performance_progress int;
  v_social_progress int;
  v_new_completions int := 0;
  v_all_completed boolean;
  v_skips_this_month int;
begin
  -- Determine the week for this match
  select date_trunc('week', played_at)::date into v_week_start
  from matches
  where id = p_match_id;

  -- Get the challenges for this week
  select
    (select target_value from weekly_challenges where group_id = p_group_id and week_start = v_week_start and challenge_type = 'volume'),
    (select target_value from weekly_challenges where group_id = p_group_id and week_start = v_week_start and challenge_type = 'performance'),
    (select target_value from weekly_challenges where group_id = p_group_id and week_start = v_week_start and challenge_type = 'social')
  into v_challenge_volume, v_challenge_performance, v_challenge_social;

  if v_challenge_volume is null then
    -- No challenges for this week, skip
    return jsonb_build_object('updated', false, 'reason', 'no_challenges');
  end if;

  -- Get all players in the match
  select array_agg(distinct player_id) into v_players
  from match_team_players mtp
  join match_teams mt on mt.id = mtp.match_team_id
  where mt.match_id = p_match_id;

  -- Update progress for each player
  foreach v_player_id in array v_players loop
    -- Calculate volume progress (matches played this week)
    select count(*) into v_volume_progress
    from matches m
    join match_teams mt on mt.match_id = m.id
    join match_team_players mtp on mtp.match_team_id = mt.id
    where m.group_id = p_group_id
      and m.id <= p_match_id -- Only count matches up to this one
      and mtp.player_id = v_player_id
      and date_trunc('week', m.played_at)::date = v_week_start;

    -- Calculate performance progress (wins this week)
    select count(*) into v_performance_progress
    from matches m
    join v_match_winners mw on mw.match_id = m.id
    join match_teams mt on mt.match_id = m.id
    join match_team_players mtp on mtp.match_team_id = mt.id
    where m.group_id = p_group_id
      and m.id <= p_match_id
      and mtp.player_id = v_player_id
      and mw.team_number = mt.team_number
      and date_trunc('week', m.played_at)::date = v_week_start;

    -- Calculate social progress (unique partners this week)
    with unique_partners as (
      select
        case
          when p1.player_id < p2.player_id then p1.player_id || '_' || p2.player_id
          else p2.player_id || '_' || p1.player_id
        end as partnership_id
      from match_teams mt1
      join match_team_players p1 on p1.match_team_id = mt1.id
      join match_teams mt2 on mt2.match_id = mt1.match_id and mt2.id != mt1.id
      join match_team_players p2 on p2.match_team_id = mt2.id
      join matches m on m.id = mt1.match_id
      where m.group_id = p_group_id
        and m.id <= p_match_id
        and (p1.player_id = v_player_id or p2.player_id = v_player_id)
        and date_trunc('week', m.played_at)::date = v_week_start
      group by partnership_id
    )
    select count(*) into v_social_progress from unique_partners;

    -- Update progress
    update player_weekly_progress
    set
      challenge_volume_completed = (v_volume_progress >= v_challenge_volume),
      challenge_performance_completed = (v_performance_progress >= v_challenge_performance),
      challenge_social_completed = (v_social_progress >= v_challenge_social),
      challenges_completed =
        (v_volume_progress >= v_challenge_volume)::int +
        (v_performance_progress >= v_challenge_performance)::int +
        (v_social_progress >= v_challenge_social)::int,
      updated_at = now()
    where player_id = v_player_id
      and group_id = p_group_id
      and week_start = v_week_start;

    -- Check if all challenges completed and update streak
    select (challenge_volume_completed and challenge_performance_completed and challenge_social_completed)
    into v_all_completed
    from player_weekly_progress
    where player_id = v_player_id
      and group_id = p_group_id
      and week_start = v_week_start;

    if v_all_completed then
      v_new_completions := v_new_completions + 1;

      -- Update streak
      insert into streaks (player_id, group_id, current_streak, longest_streak, last_completed_week, updated_at)
      values (v_player_id, p_group_id, 1, 1, v_week_start, now())
      on conflict (player_id, group_id) do update set
        current_streak = streaks.current_streak + 1,
        longest_streak = greatest(streaks.longest_streak, streaks.current_streak + 1),
        last_completed_week = v_week_start,
        updated_at = now();

      -- Award weekly completion badge (if not already earned)
      if not exists(
        select 1 from player_badges pb
        join badges b on b.id = pb.badge_id
        where pb.player_id = v_player_id
          and b.badge_type = 'weekly_complete'
          and b.milestone_value is null
      ) then
        insert into player_badges (player_id, badge_id)
        select v_player_id, id from badges
        where badge_type = 'weekly_complete' and milestone_value is null
        limit 1;
      end if;

      -- Check for streak milestone badges
      select current_streak into v_performance_progress -- reuse variable
      from streaks
      where player_id = v_player_id and group_id = p_group_id;

      -- Award streak badges at milestones (2, 4, 8, 12, 24)
      if v_performance_progress in (2, 4, 8, 12, 24) then
        insert into player_badges (player_id, badge_id)
        select v_player_id, id from badges
        where badge_type = 'streak_milestone'
          and milestone_value = v_performance_progress
          and not exists(
            select 1 from player_badges
            where player_id = v_player_id and badge_id = badges.id
          );
      end if;
    end if;
  end loop;

  return jsonb_build_object(
    'updated', true,
    'new_completions', v_new_completions
  );
end;
$$ language plpgsql;

-- Function: Process weekly rollover (reset streaks for incomplete weeks)
create or replace function process_weekly_rollover(
  p_week_start date
)
returns integer as $$
declare
  v_streaks_reset int := 0;
  v_skip_count int;
begin
  -- For each player who didn't complete last week (and didn't skip), reset streak
  update streaks s
  set
    current_streak = 0,
    updated_at = now()
  where exists(
    select 1 from player_weekly_progress pwp
    where pwp.player_id = s.player_id
      and pwp.group_id = s.group_id
      and pwp.week_start = (p_week_start - interval '1 week')::date
      and not pwp.skipped
      and (
        pwp.challenge_volume_completed = false or
        pwp.challenge_performance_completed = false or
        pwp.challenge_social_completed = false
      )
  );

  get diagnostics v_streaks_reset = row_count;

  return v_streaks_reset;
end;
$$ language plpgsql;

-- Function: Get current challenges and progress for a player
create or replace function get_player_challenges(
  p_group_id uuid,
  p_player_id uuid
)
returns jsonb as $$
declare
  v_current_week date;
  v_challenges jsonb := '[]'::jsonb;
  v_progress record;
  v_challenge record;
  v_streak record;
  v_result jsonb;
  v_volume_progress int;
  v_performance_progress int;
  v_social_progress int;
  v_unique_partners int;
begin
  -- Get current week (Monday)
  v_current_week := date_trunc('week', now())::date;

  -- Get current challenges
  for v_challenge in
    select challenge_type, target_value
    from weekly_challenges
    where group_id = p_group_id and week_start = v_current_week
    order by challenge_type
  loop
    v_challenges := v_challenges || jsonb_build_object(
      'type', v_challenge.challenge_type,
      'target', v_challenge.target_value
    );
  end loop;

  -- Get player's progress for current week
  select * into v_progress
  from player_weekly_progress
  where player_id = p_player_id
    and group_id = p_group_id
    and week_start = v_current_week;

  -- Get player's streak
  select * into v_streak
  from streaks
  where player_id = v_player_id and group_id = p_group_id;

  -- Calculate actual progress counts
  -- Volume: matches played this week
  select count(*) into v_volume_progress
  from matches m
  join match_teams mt on mt.match_id = m.id
  join match_team_players mtp on mtp.match_team_id = mt.id
  where m.group_id = p_group_id
    and mtp.player_id = p_player_id
    and date_trunc('week', m.played_at)::date = v_current_week;

  -- Performance: wins this week
  select count(*) into v_performance_progress
  from matches m
  join v_match_winners mw on mw.match_id = m.id
  join match_teams mt on mt.match_id = m.id
  join match_team_players mtp on mtp.match_team_id = mt.id
  where m.group_id = p_group_id
    and mtp.player_id = p_player_id
    and mw.team_number = mt.team_number
    and date_trunc('week', m.played_at)::date = v_current_week;

  -- Social: unique partners this week
  with unique_partners as (
    select
      case
        when p1.player_id < p2.player_id then p1.player_id || '_' || p2.player_id
        else p2.player_id || '_' || p1.player_id
      end as partnership_id
    from match_teams mt1
    join match_team_players p1 on p1.match_team_id = mt1.id
    join match_teams mt2 on mt2.match_id = mt1.match_id and mt2.id != mt1.id
    join match_team_players p2 on p2.match_team_id = mt2.id
    join matches m on m.id = mt1.match_id
    where m.group_id = p_group_id
      and (p1.player_id = p_player_id or p2.player_id = p_player_id)
      and date_trunc('week', m.played_at)::date = v_current_week
    group by partnership_id
  )
  select count(*) into v_unique_partners from unique_partners;

  v_social_progress := coalesce(v_unique_partners, 0);

  v_result := jsonb_build_object(
    'current_week', v_current_week,
    'challenges', v_challenges,
    'progress', jsonb_build_object(
      'volume', jsonb_build_object(
        'current', v_volume_progress,
        'completed', coalesce(v_progress.challenge_volume_completed, false)
      ),
      'performance', jsonb_build_object(
        'current', v_performance_progress,
        'completed', coalesce(v_progress.challenge_performance_completed, false)
      ),
      'social', jsonb_build_object(
        'current', v_social_progress,
        'completed', coalesce(v_progress.challenge_social_completed, false)
      ),
      'total_completed', coalesce(v_progress.challenges_completed, 0),
      'skipped', coalesce(v_progress.skipped, false)
    ),
    'streak', jsonb_build_object(
      'current', coalesce(v_streak.current_streak, 0),
      'longest', coalesce(v_streak.longest_streak, 0),
      'last_completed', v_streak.last_completed_week
    ),
    'time_remaining', extract(epoch from (v_current_week + interval '7 days' - now()))::int
  );

  return v_result;
end;
$$ language plpgsql;

-- Function: Get weekly leaderboard
create or replace function get_weekly_leaderboard(
  p_group_id uuid,
  p_week_start date default date_trunc('week', now())::date
)
returns jsonb as $$
declare
  v_leaderboard jsonb := '[]'::jsonb;
  v_record record;
begin
  for v_record in
    select
      p.id as player_id,
      p.name,
      pwp.challenges_completed,
      pwp.challenge_volume_completed,
      pwp.challenge_performance_completed,
      pwp.challenge_social_completed,
      s.current_streak,
      row_number() over (order by pwp.challenges_completed desc, s.current_streak desc) as position
    from player_weekly_progress pwp
    join players p on p.id = pwp.player_id
    left join streaks s on s.player_id = pwp.player_id and s.group_id = pwp.group_id
    where pwp.group_id = p_group_id
      and pwp.week_start = p_week_start
      and not pwp.skipped
    order by pwp.challenges_completed desc, s.current_streak desc
    limit 10
  loop
    v_leaderboard := v_leaderboard || jsonb_build_object(
      'player_id', v_record.player_id,
      'player_name', v_record.name,
      'position', v_record.position,
      'challenges_completed', v_record.challenges_completed,
      'current_streak', v_record.current_streak
    );
  end loop;

  return jsonb_build_object('leaderboard', v_leaderboard, 'week', p_week_start);
end;
$$ language plpgsql;

-- Function: Get streak leaderboard
create or replace function get_streak_leaderboard(
  p_group_id uuid
)
returns jsonb as $$
declare
  v_leaderboard jsonb := '[]'::jsonb;
  v_record record;
begin
  for v_record in
    select
      p.id as player_id,
      p.name,
      s.current_streak,
      s.longest_streak,
      s.last_completed_week,
      row_number() over (order by s.current_streak desc) as position
    from streaks s
    join players p on p.id = s.player_id
    where s.group_id = p_group_id
      and s.current_streak > 0
    order by s.current_streak desc, s.longest_streak desc
    limit 10
  loop
    v_leaderboard := v_leaderboard || jsonb_build_object(
      'player_id', v_record.player_id,
      'player_name', v_record.name,
      'position', v_record.position,
      'current_streak', v_record.current_streak,
      'longest_streak', v_record.longest_streak
    );
  end loop;

  return jsonb_build_object('leaderboard', v_leaderboard);
end;
$$ language plpgsql;

-- Function: Skip a week (max 1 skip per month)
create or replace function skip_week(
  p_group_id uuid,
  p_player_id uuid
)
returns jsonb as $$
declare
  v_current_week date;
  v_skip_count int;
begin
  v_current_week := date_trunc('week', now())::date;

  -- Check if already skipped
  if exists(
    select 1 from player_weekly_progress
    where player_id = p_player_id
      and group_id = p_group_id
      and week_start = v_current_week
      and skipped = true
  ) then
    return jsonb_build_object('success', false, 'reason', 'already_skipped');
  end if;

  -- Count skips in current month
  select count(*) into v_skip_count
  from player_weekly_progress
  where player_id = p_player_id
    and group_id = p_group_id
    and skipped = true
    and date_trunc('month', week_start) = date_trunc('month', v_current_week);

  if v_skip_count >= 1 then
    return jsonb_build_object('success', false, 'reason', 'max_skips_reached');
  end if;

  -- Mark as skipped
  update player_weekly_progress
  set skipped = true, updated_at = now()
  where player_id = p_player_id
    and group_id = p_group_id
    and week_start = v_current_week;

  return jsonb_build_object('success', true);
end;
$$ language plpgsql;

-- ============================================================
-- SEED DATA (Badges)
-- ============================================================

-- Weekly completion badge
insert into badges (name, description, badge_type, milestone_value, icon, display_order)
values
  ('Weekly Complete', 'Completed all 3 weekly challenges', 'weekly_complete', null, '✅', 1);

-- Streak milestone badges
insert into badges (name, description, badge_type, milestone_value, icon, display_order)
values
  ('Getting Started', 'Complete weekly challenges for 2 weeks in a row', 'streak_milestone', 2, '🌱', 1),
  ('Consistent', 'Complete weekly challenges for 4 weeks in a row', 'streak_milestone', 4, '💪', 2),
  ('Dedicated', 'Complete weekly challenges for 8 weeks in a row', 'streak_milestone', 8, '🔥', 3),
  ('Seasoned Player', 'Complete weekly challenges for 12 weeks in a row', 'streak_milestone', 12, '⭐', 4),
  ('Legendary', 'Complete weekly challenges for 24+ weeks in a row', 'streak_milestone', 24, '👑', 5);

-- Special badge for full year
insert into badges (name, description, badge_type, milestone_value, icon, display_order)
values
  ('Year of Padel', 'Complete weekly challenges for a full year', 'special', 52, '🏆', 1);
