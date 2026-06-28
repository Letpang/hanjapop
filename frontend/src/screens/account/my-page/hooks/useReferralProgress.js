import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ENTITLEMENT_STALE_MS, entitlementQueryKeys } from '../../../../hooks/entitlementQueries.ts';
import { useLang } from '../../../../hooks/useLang.js';
import { fetchReferralSummary } from '../../../../lib/supabase.js';
import { buildReferralShareUrl } from '../../profileData.js';

const DEFAULT_MILESTONES = [
  { count: 1, title: 'ext_1759', subtitle: 'ext_1480' },
  { count: 3, title: 'ext_1760', subtitle: 'ext_1480' },
  { count: 5, title: 'ext_1699', subtitle: 'ext_1480' },
];

export const useReferralProgress = () => {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);

  const { data: summary = null } = useQuery({
    queryKey: entitlementQueryKeys.referralSummary(),
    queryFn: async () => {
      const { summary: next } = await fetchReferralSummary();
      return next || null;
    },
    staleTime: ENTITLEMENT_STALE_MS,
  });

  const count = Math.min(5, Number(summary?.activated_count || 0));
  const progress = Math.min(100, (count / 5) * 100);
  const activeOffer = summary?.active_offer?.eligible ? summary.active_offer : null;
  const shareUrl = summary?.code ? buildReferralShareUrl(summary.code) : '';

  const offerExpiryLabel = useMemo(() => {
    if (!activeOffer) return '';
    if (!activeOffer.expires_at) return t('ext_1480');
    const dayMs = 24 * 60 * 60 * 1000;
    const n = Math.max(1, Math.ceil((new Date(activeOffer.expires_at).getTime() - Date.now()) / dayMs));
    return t('ext_3204', { n });
  }, [activeOffer, t]);

  const subtitle = useMemo(() => {
    if (count < 1) return t('ext_2277');
    if (count < 5) return t('ext_3226', { n: 5 - count });
    return t('ext_1811');
  }, [count, t]);

  const milestones = useMemo(() => {
    const source = Array.isArray(summary?.milestones) ? summary.milestones : DEFAULT_MILESTONES;
    return source.map(item => ({
      ...item,
      title: t(item.title),
      subtitle: t(item.subtitle || 'ext_1480'),
      done: Boolean(item.done) || count >= Number(item.count || 0),
    }));
  }, [count, summary?.milestones, t]);

  const handleShare = useCallback(async () => {
    if (!shareUrl) return;

    setCopied(false);
    const text = t('ext_3227', { shareUrl });

    try {
      if (navigator.share) {
        await navigator.share({ title: t('ext_1700'), text, url: shareUrl });
        return;
      }

      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch (error) {
      if (error?.name === 'AbortError') return;

      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      } catch {}
    }
  }, [shareUrl, t]);

  return {
    activeOffer,
    copied,
    count,
    fullpackGranted: Boolean(summary?.fullpack_granted),
    isVisible: Boolean(summary?.code),
    milestones,
    offerExpiryLabel,
    progress,
    referralCode: summary?.code || '',
    subtitle,
    handleShare,
  };
};
