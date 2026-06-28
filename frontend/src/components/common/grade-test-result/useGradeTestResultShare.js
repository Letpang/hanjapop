import { useState } from 'react';
import { useLang } from '../../../hooks/useLang.js';
import { shareImageToKakao } from '../../../utils/kakaoShare.js';

export const useGradeTestResultShare = ({ cardRef, correct, grade, total }) => {
  const { t } = useLang();
  const [shareStatus, setShareStatus] = useState('');

  const handleShare = async () => {
    setShareStatus(t('ext_1745'));
    try {
      let file = null;
      if (cardRef.current) {
        const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: null });
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));
        if (blob) file = new File([blob], 'hanjapop-grade.png', { type: 'image/png' });
      }

      setShareStatus(t('ext_1842'));
      await shareImageToKakao({
        file,
        title: t('ext_2261', { grade }),
        description: t('ext_2685', { correct, total }),
        fallbackText: t('ext_2870', { grade, correct, total }),
        campaign: 'grade_pass',
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
