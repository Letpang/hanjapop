create or replace function public.consume_my_referral_offer(p_offer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_account_id uuid;
    v_consumed boolean;
begin
    v_account_id := public.ensure_my_account();

    update public.referral_offers
    set status = 'used',
        used_at = now()
    where id = p_offer_id
      and account_id = v_account_id
      and status = 'active'
      and (expires_at is null or expires_at > now())
    returning true into v_consumed;

    return jsonb_build_object('consumed', coalesce(v_consumed, false));
end;
$$;

revoke all on function public.consume_my_referral_offer(uuid) from public;
grant execute on function public.consume_my_referral_offer(uuid) to authenticated;
