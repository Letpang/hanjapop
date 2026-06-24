revoke all on function public.consume_my_referral_offer(uuid) from public;
revoke all on function public.consume_my_referral_offer(uuid) from anon;
grant execute on function public.consume_my_referral_offer(uuid) to authenticated;
