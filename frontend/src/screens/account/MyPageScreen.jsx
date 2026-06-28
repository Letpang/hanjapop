import { useState } from 'react';
import BadgeDetailModal from './components/BadgeDetailModal.jsx';
import BadgeVault from './components/BadgeVault.jsx';
import DetailLinksPanel from './components/DetailLinksPanel.jsx';
import GradeBadgeModal from './components/GradeBadgeModal.jsx';
import LearningStatsPanel from './components/LearningStatsPanel.jsx';
import MasterProfileCard from './components/MasterProfileCard.jsx';
import MyPageHeader from './components/MyPageHeader.jsx';
import ProfileSummaryCard from './components/ProfileSummaryCard.jsx';
import ReferralProgressCard from './components/ReferralProgressCard.jsx';
import { useMyPageBadges } from './my-page/hooks/useMyPageBadges.js';
import { useMyPageStats } from './my-page/hooks/useMyPageStats.js';

const MyPageScreen = ({
  onBack,
  onNavigate,
  userXp,
  userNickname,
  selectedCharacter,
  isDarkMode,
  streak,
  totalStats,
  finalJourney,
}) => {
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [hoveredBadgeId, setHoveredBadgeId] = useState(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const { stats, streakCount } = useMyPageStats({ streak, totalStats });
  const { unlockedIdx, currentGradeBadge, studyBadge } = useMyPageBadges();

  return (
    <div className="min-h-screen flex flex-col ">
      <MyPageHeader onBack={onBack} onSettings={() => onNavigate('settings')} />

      <div
        className="flex flex-col gap-6 px-5 pt-6 max-w-2xl w-full mx-auto"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 3rem)' }}
      >
        <ProfileSummaryCard
          userNickname={userNickname}
          userXp={userXp}
          selectedCharacter={selectedCharacter}
          currentGradeBadge={currentGradeBadge}
          studyBadge={studyBadge}
          streakCount={streakCount}
          finalJourney={finalJourney}
          onOpenGradeModal={() => setShowGradeModal(true)}
        />

        <MasterProfileCard finalJourney={finalJourney} />

        <ReferralProgressCard isDarkMode={isDarkMode} />

        <BadgeVault
          streak={streak}
          totalStats={totalStats}
          hoveredBadgeId={hoveredBadgeId}
          onHoverBadge={setHoveredBadgeId}
          onSelectBadge={setSelectedBadge}
        />

        <LearningStatsPanel
          stats={stats}
          streakCount={streakCount}
          isDarkMode={isDarkMode}
        />

        <DetailLinksPanel onNavigate={onNavigate} />
      </div>

      <BadgeDetailModal
        selectedBadge={selectedBadge}
        streak={streak}
        totalStats={totalStats}
        onClose={() => setSelectedBadge(null)}
      />

      <GradeBadgeModal
        isOpen={showGradeModal}
        unlockedIdx={unlockedIdx}
        onClose={() => setShowGradeModal(false)}
      />
    </div>
  );
};

export default MyPageScreen;
