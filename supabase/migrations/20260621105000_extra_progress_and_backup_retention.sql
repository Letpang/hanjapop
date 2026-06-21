alter table public.account_learning_data
    add column if not exists extra_progress jsonb not null default '{}'::jsonb;

create or replace function public.sync_my_account_data(p_profile jsonb, p_learning jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_account_id uuid;
    v_old_profile jsonb;
    v_old_learning jsonb;
begin
    v_account_id := public.ensure_my_account();

    select to_jsonb(p) into v_old_profile
    from public.account_profiles p where account_id = v_account_id;
    select to_jsonb(l) into v_old_learning
    from public.account_learning_data l where account_id = v_account_id;

    if v_old_profile is not null or v_old_learning is not null then
        insert into public.account_backup_versions(account_id, profile_data, learning_data)
        values (v_account_id, v_old_profile, v_old_learning);
    end if;

    insert into public.account_profiles(
        account_id, nickname, character_type, xp, level, streak_count,
        unlocked_pack, is_premium, last_active, updated_at
    ) values (
        v_account_id,
        coalesce(nullif(p_profile ->> 'nickname', ''), '한자학습자'),
        coalesce(nullif(p_profile ->> 'character_type', ''), 'garae'),
        coalesce((p_profile ->> 'xp')::integer, 0),
        coalesce((p_profile ->> 'level')::integer, 1),
        coalesce((p_profile ->> 'streak_count')::integer, 0),
        0, false, now(), now()
    )
    on conflict (account_id) do update set
        nickname = case when excluded.xp >= account_profiles.xp then excluded.nickname else account_profiles.nickname end,
        character_type = case when excluded.xp >= account_profiles.xp then excluded.character_type else account_profiles.character_type end,
        xp = greatest(account_profiles.xp, excluded.xp),
        level = greatest(account_profiles.level, excluded.level),
        streak_count = greatest(account_profiles.streak_count, excluded.streak_count),
        last_active = now(),
        updated_at = now();

    insert into public.account_learning_data(
        account_id, mastery_data, srs_data, total_stats, unlocked_stickers,
        curriculum_progress, word_wrong_data, daily_study_log, extra_progress, updated_at
    ) values (
        v_account_id,
        coalesce(p_learning -> 'mastery_data', '{}'::jsonb),
        coalesce(p_learning -> 'srs_data', '{}'::jsonb),
        coalesce(p_learning -> 'total_stats', '{}'::jsonb),
        coalesce(p_learning -> 'unlocked_stickers', '{}'::jsonb),
        coalesce(p_learning -> 'curriculum_progress', '{}'::jsonb),
        coalesce(p_learning -> 'word_wrong_data', '{}'::jsonb),
        coalesce(p_learning -> 'daily_study_log', '{}'::jsonb),
        coalesce(p_learning -> 'extra_progress', '{}'::jsonb),
        now()
    )
    on conflict (account_id) do update set
        mastery_data = account_learning_data.mastery_data || excluded.mastery_data,
        srs_data = account_learning_data.srs_data || excluded.srs_data,
        total_stats = public.jsonb_numeric_max_merge(account_learning_data.total_stats, excluded.total_stats),
        unlocked_stickers = account_learning_data.unlocked_stickers || excluded.unlocked_stickers,
        curriculum_progress = case
            when coalesce((excluded.curriculum_progress ->> 'journeyRound')::integer, 1)
               > coalesce((account_learning_data.curriculum_progress ->> 'journeyRound')::integer, 1)
                then excluded.curriculum_progress
            when coalesce((excluded.curriculum_progress ->> 'journeyRound')::integer, 1)
               = coalesce((account_learning_data.curriculum_progress ->> 'journeyRound')::integer, 1)
             and coalesce((excluded.curriculum_progress ->> 'completedDay')::integer, 0)
               >= coalesce((account_learning_data.curriculum_progress ->> 'completedDay')::integer, 0)
                then excluded.curriculum_progress
            else account_learning_data.curriculum_progress
        end,
        word_wrong_data = account_learning_data.word_wrong_data || excluded.word_wrong_data,
        daily_study_log = public.jsonb_deep_max_merge(account_learning_data.daily_study_log, excluded.daily_study_log),
        extra_progress = public.jsonb_deep_max_merge(account_learning_data.extra_progress, excluded.extra_progress),
        updated_at = now();

    delete from public.account_backup_versions
    where account_id = v_account_id
      and id not in (
          select id from public.account_backup_versions
          where account_id = v_account_id
          order by created_at desc
          limit 3
      );

    return v_account_id;
end;
$$;

-- Apply the smaller retention policy immediately to existing accounts.
delete from public.account_backup_versions b
where b.id not in (
    select kept.id
    from public.account_backup_versions kept
    where kept.account_id = b.account_id
    order by kept.created_at desc
    limit 3
);

revoke all on function public.sync_my_account_data(jsonb, jsonb) from public;
grant execute on function public.sync_my_account_data(jsonb, jsonb) to authenticated;

