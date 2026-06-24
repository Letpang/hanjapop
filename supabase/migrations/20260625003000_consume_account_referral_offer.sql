create or replace function public.consume_account_referral_offer(
    p_account_id uuid,
    p_discount_percent integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_consumed boolean;
begin
    update public.referral_offers
    set status = 'used',
        used_at = now()
    where id = (
        select id
        from public.referral_offers
        where account_id = p_account_id
          and discount_percent = p_discount_percent
          and status = 'active'
          and (expires_at is null or expires_at > now())
        order by created_at asc
        limit 1
    )
    returning true into v_consumed;

    return jsonb_build_object('consumed', coalesce(v_consumed, false));
end;
$$;

revoke all on function public.consume_account_referral_offer(uuid, integer) from public;
revoke all on function public.consume_account_referral_offer(uuid, integer) from anon;
revoke all on function public.consume_account_referral_offer(uuid, integer) from authenticated;
grant execute on function public.consume_account_referral_offer(uuid, integer) to service_role;
