import { useRef } from 'react';
import { getRankDetails, getLevel, levelToImageRank } from '../utils/rankUtils.js';
import ResultModalShell, {
  ResultModalActions,
  ResultModalHeading,
  ResultPrimaryButton,
  ResultShareButton,
} from './common/ResultModalShell.jsx';
import RankUpCharacter from './rank-up-modal/RankUpCharacter.jsx';
import RankUpModalStyles from './rank-up-modal/RankUpModalStyles.jsx';
import RankUpParticles from './rank-up-modal/RankUpParticles.jsx';
import { RANK_COLORS } from './rank-up-modal/rankUpModalData.js';
import { useRankUpShare } from './rank-up-modal/useRankUpShare.js';
import { useLang } from '../hooks/useLang.js';

const RankUpModal = ({ selectedCharacter, userXp, onClose }) => {
  const level = getLevel(userXp);
  const imageRank = levelToImageRank(level);
  const details = getRankDetails(userXp, selectedCharacter);
  const colors = RANK_COLORS[imageRank] || RANK_COLORS[2];
  const { t } = useLang();
  const rankLabels = { 2: t('ext_1556'), 3: t('ext_1557'), 4: t('ext_1558'), 5: t('ext_1481') };
  const rankLabel = rankLabels[imageRank] || t('ext_273');
  const modalRef = useRef(null);
  const { handleShare, shareStatus } = useRankUpShare({ details, modalRef, onClose, rankLabel });

  return (
    <ResultModalShell
      ref={modalRef}
      className="rank-up-overlay"
      cardClassName="flex flex-col items-center overflow-hidden"
      onBackdropClick={onClose}
      labelledBy="rank-up-title"
    >
      <RankUpModalStyles />
      <RankUpParticles colors={colors} />
      <RankUpCharacter details={details} />

      <ResultModalHeading
        id="rank-up-title"
        kicker={rankLabel}
        title={t('ext_1473')}
        description={(
          <>
            <span className="font-normal" style={{ color: colors.to }}>{t(details.name)}</span>{t('ext_1067')}<br />
            <span className="font-normal text-slate-700 dark:text-slate-100">{t(details.rankName)}</span>{t('ext_1782')}
          </>
        )}
      />

      <ResultModalActions className="relative z-10 mt-6">
        <ResultShareButton
          onClick={handleShare}
          title={t('ext_1791')}
          subtitle={t('ext_2422', { rankLabel })}
        />
        {shareStatus && <p className="text-base text-slate-400">{shareStatus}</p>}
        <ResultPrimaryButton onClick={onClose}>{t('ext_274')}</ResultPrimaryButton>
      </ResultModalActions>

      <p className="relative z-10 mt-3 text-xs text-slate-400 font-normal">
        {t('ext_2423')}
      </p>
    </ResultModalShell>
  );
};

export default RankUpModal;