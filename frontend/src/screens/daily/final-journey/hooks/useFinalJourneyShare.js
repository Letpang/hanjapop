import { useEffect, useState } from 'react';
import { getKakaoShareConfig, shareMasterAchievementToKakao } from '../../../../utils/kakaoShare.js';
import { createMasterShareFile } from '../finalJourneyShare.js';
import { useLang } from '../../../../hooks/useLang.js';

const useFinalJourneyShare = ({ characterImage, userNickname, hanjaCount, completedDate }) => {
  const { t } = useLang();
  const [shareFile, setShareFile] = useState(null);
  const [shareStatus, setShareStatus] = useState('');

  useEffect(() => {
    let active = true;
    createMasterShareFile({ characterImage, nickname: userNickname, hanjaCount, completedDate, t })
      .then((file) => {
        if (active) setShareFile(file);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [characterImage, userNickname, hanjaCount, completedDate]);

  const handleShare = async () => {
    const nickname = userNickname || t('ext_980');
    const url = getKakaoShareConfig().shareUrl || window.location.origin;
    const description = t('ext_3221', { hanjaCount });
    const title = t('ext_3222', { nickname });
    const text = t('ext_3220', { nickname });
    setShareStatus(t('ext_1842'));

    try {
      const result = await shareMasterAchievementToKakao({
        file: shareFile,
        title,
        description,
        fallbackText: `${t('ext_1815')}\n${description}`,
        buttonTitle: t('ext_1688'),
        t,
      });
      setShareStatus(result.imageFallback ? t('ext_2316') : t('ext_1902'));
    } catch (error) {
      if (error?.name === 'AbortError' || /cancel|close|canceled/i.test(String(error?.message || error))) {
        setShareStatus('');
        return;
      }

      const shareData = { title: t('ext_1815'), text, url };
      if (shareFile && navigator.canShare?.({ files: [shareFile] })) shareData.files = [shareFile];

      try {
        if (navigator.share) {
          await navigator.share(shareData);
          setShareStatus(t('ext_3223', { error: error?.message || t('ext_1703') }));
        } else {
          await navigator.clipboard.writeText(`${text}\n${url}`);
          setShareStatus(t('ext_3224', { error: error?.message || t('ext_1703') }));
        }
      } catch (fallbackError) {
        if (fallbackError?.name === 'AbortError') {
          setShareStatus('');
          return;
        }
        setShareStatus(error?.message || t('ext_2179'));
      }
    }

    window.setTimeout(() => setShareStatus(''), 4200);
  };

  return { shareStatus, handleShare };
};

export default useFinalJourneyShare;
