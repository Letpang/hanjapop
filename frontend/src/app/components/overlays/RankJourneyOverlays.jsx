import { Suspense } from 'react';
import { NewJourneyModal, RankUpModal } from '../../appScreens.js';

const RankJourneyOverlays = ({
  handleStartNewJourney,
  isJourneyComplete,
  journeyRound,
  onBrowseJourneyMemory,
  selectedCharacter,
  setShowNewJourneyModal,
  setShowRankUpModal,
  showNewJourneyModal,
  showRankUpModal,
  userXp,
}) => (
  <>
    {showRankUpModal && (
      <Suspense fallback={null}>
        <RankUpModal
          selectedCharacter={selectedCharacter}
          userXp={userXp}
          onClose={() => setShowRankUpModal(false)}
        />
      </Suspense>
    )}

    {showNewJourneyModal && isJourneyComplete && (
      <Suspense fallback={null}>
        <NewJourneyModal
          nextRound={journeyRound + 1}
          onBrowseMemory={onBrowseJourneyMemory}
          onStart={handleStartNewJourney}
          onClose={() => setShowNewJourneyModal(false)}
        />
      </Suspense>
    )}
  </>
);

export default RankJourneyOverlays;
