import { GRADE_BADGES } from '../profileData.js';
import BadgeModalShell from '../my-page/badges/components/BadgeModalShell.jsx';
import BadgeModalTitle from '../my-page/badges/components/BadgeModalTitle.jsx';
import GradeBadgeGrid from '../my-page/badges/components/GradeBadgeGrid.jsx';
import GradeBadgeNextPanel from '../my-page/badges/components/GradeBadgeNextPanel.jsx';
import { useLang } from '../../../hooks/useLang.js';

const GradeBadgeModal = ({ isOpen, unlockedIdx, onClose }) => {
  const { t } = useLang();

  if (!isOpen) return null;

  const statusLabel = unlockedIdx === -1
    ? t('ext_1618')
    : unlockedIdx >= GRADE_BADGES.length - 1
      ? t('ext_1809')
      : `${t(GRADE_BADGES[unlockedIdx].label)} ${t('ext_1506')}`;
  const nextBadge = GRADE_BADGES[Math.min(unlockedIdx + 1, GRADE_BADGES.length - 1)];
  const isComplete = unlockedIdx >= GRADE_BADGES.length - 1;

  return (
    <BadgeModalShell onClose={onClose}>
      <BadgeModalTitle title={t('ext_1661')} status={statusLabel} />
      <GradeBadgeGrid badges={GRADE_BADGES} unlockedIdx={unlockedIdx} />
      <GradeBadgeNextPanel isComplete={isComplete} nextBadge={nextBadge} />
    </BadgeModalShell>
  );
};

export default GradeBadgeModal;