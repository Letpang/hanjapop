import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ENTITLEMENT_STALE_MS, entitlementQueryKeys } from '../../../../hooks/entitlementQueries.ts';
import { useLang } from '../../../../hooks/useLang.js';
import { fetchReferralSummary } from '../../../../lib/supabase.js';
import { shareImageToKakao } from '../../../../utils/kakaoShare.js';
import { getReferralShareSubtitle } from '../dailyResultData.js';

const getHanjaShareDescription = (todayHanja) => (
  todayHanja
    .filter((hanja) => hanja.id)
    .slice(0, 3)
    .map((hanja) => `${hanja.hanja}(${hanja.sound})`)
    .join(' · ')
);

const useDailyResultShare = ({ todayHanja, userNickname, dayNumber }) => {
  const { t } = useLang();
  const [shareStatus, setShareStatus] = useState('');
  const shareInviteCardRef = useRef(null);
  const { data: referralSummary = null } = useQuery({
    queryKey: entitlementQueryKeys.referralSummary(),
    queryFn: async () => {
      const { summary } = await fetchReferralSummary();
      return summary || null;
    },
    staleTime: ENTITLEMENT_STALE_MS,
  });

  const referralActivatedCount = Math.min(5, Number(referralSummary?.activated_count || 0));
  const referralShareSubtitle = getReferralShareSubtitle(referralActivatedCount, t);

  const handleDailyShare = async () => {
    const nickname = userNickname || t('ext_980');
    const hanjaDesc = getHanjaShareDescription(todayHanja);
    setShareStatus(t('ext_1923'));

    try {
      let file = null;
      if (shareInviteCardRef.current) {
        const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(shareInviteCardRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#F7FAF9',
        });
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));
        if (blob) file = new File([blob], 'hanjapop-invite.png', { type: 'image/png' });
      }

      setShareStatus(t('ext_1842'));
      await shareImageToKakao({
        file,
        title: t('ext_3234', { nickname }),
        description: t('ext_2680'),
        fallbackText: t('ext_3235', { nickname, dayNumber, hanjaDesc }),
        campaign: 'daily_clear',
        buttonTitle: t('ext_1764'),
        imageWidth: 800,
        imageHeight: 1000,
        t,
      });
      setShareStatus(t('ext_1902'));
    } catch (error) {
      if (error?.name === 'AbortError' || /cancel|close|canceled/i.test(String(error?.message || error))) {
        setShareStatus('');
        return;
      }
      setShareStatus(t('ext_1746'));
    }

    setTimeout(() => setShareStatus(''), 3500);
  };

  return {
    shareInviteCardRef,
    shareStatus,
    referralActivatedCount,
    referralShareSubtitle,
    handleDailyShare,
  };
};

export default useDailyResultShare;
