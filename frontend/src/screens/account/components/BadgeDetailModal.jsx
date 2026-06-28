import { getBadgeProgress } from '../my-page/badges/badgeProgress.js';
import BadgeCompletionPanel from '../my-page/badges/components/BadgeCompletionPanel.jsx';
import BadgeModalShell from '../my-page/badges/components/BadgeModalShell.jsx';
import BadgeModalTitle from '../my-page/badges/components/BadgeModalTitle.jsx';
import BadgeProgressPanel from '../my-page/badges/components/BadgeProgressPanel.jsx';
import BadgeStageGrid from '../my-page/badges/components/BadgeStageGrid.jsx';
import { useLang } from '../../../hooks/useLang.js';

const BadgeDetailModal = ({ selectedBadge, streak, totalStats, onClose }) => {
  const { t } = useLang();

  if (!selectedBadge) return null;

  const progress = getBadgeProgress({ badge: selectedBadge, streak, totalStats });

  return (
    <BadgeModalShell onClose={onClose}>
      <BadgeModalTitle
        title={t(selectedBadge.label)}
        status={t('ext_2626', { current: progress.current })}
      />
      <BadgeStageGrid badge={selectedBadge} current={progress.current} />
      {progress.isComplete ? (
        <BadgeCompletionPanel />
      ) : (
        <BadgeProgressPanel badge={selectedBadge} progress={progress} />
      )}
    </BadgeModalShell>
  );
};

export default BadgeDetailModal;
