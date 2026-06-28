import { useEffect, useRef, useState } from 'react';
import { shareImageToKakao } from '../../utils/kakaoShare.js';
import { useLang } from '../../hooks/useLang.js';

export const useRankUpShare = ({ details, modalRef, onClose, rankLabel }) => {
  const { t } = useLang();
  const timerRef = useRef(null);
  const [shareStatus, setShareStatus] = useState('');

  useEffect(() => {
    timerRef.current = setTimeout(onClose, 8000);
    return () => clearTimeout(timerRef.current);
  }, [onClose]);

  const handleShare = async () => {
    clearTimeout(timerRef.current);
    setShareStatus(t('ext_1745'));
    try {
      let file = null;
      if (modalRef.current) {
        const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(modalRef.current, { scale: 2, useCORS: true, backgroundColor: null });
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));
        if (blob) file = new File([blob], 'hanjapop-rankup.png', { type: 'image/png' });
      }
      setShareStatus(t('ext_1842'));
      const name = t(details.name);
      const rankName = t(details.rankName);
      await shareImageToKakao({
        file,
        title: t('ext_3213', { name, rankName }),
        description: t('ext_3236', { rankLabel }),
        fallbackText: t('ext_3214', { name, rankName, rankLabel }),
        campaign: 'rank_up',
        buttonTitle: t('ext_1688'),
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

  return { handleShare, shareStatus };
};
