import { useEffect, useState } from 'react';
import { getCharacterImage } from '../../utils/rankUtils.js';
import FinalJourneyActions from './final-journey/components/FinalJourneyActions.jsx';
import FinalJourneyCertificate from './final-journey/components/FinalJourneyCertificate.jsx';
import FinalJourneyConfetti from './final-journey/components/FinalJourneyConfetti.jsx';
import FinalJourneyHeading from './final-journey/components/FinalJourneyHeading.jsx';
import FinalJourneyHero from './final-journey/components/FinalJourneyHero.jsx';
import FinalJourneyRewards from './final-journey/components/FinalJourneyRewards.jsx';
import StampRoughFilter from './final-journey/components/StampRoughFilter.jsx';
import { playFinalFanfare } from './final-journey/finalJourneyAudio.js';
import { getCompletedDate } from './final-journey/finalJourneyData.js';
import useFinalJourneyShare from './final-journey/hooks/useFinalJourneyShare.js';

const FinalJourneyCelebration = ({
  selectedCharacter,
  userNickname,
  hanjaCount = 369,
  onComplete,
}) => {
  const completedDate = getCompletedDate();
  const characterImage = getCharacterImage(selectedCharacter, 'success');
  const [claiming, setClaiming] = useState(false);
  const { shareStatus, handleShare } = useFinalJourneyShare({
    characterImage,
    userNickname,
    hanjaCount,
    completedDate,
  });

  useEffect(() => {
    playFinalFanfare();
  }, []);

  const handleClaim = () => {
    if (claiming) return;
    setClaiming(true);
    onComplete?.();
  };

  return (
    <div className="final-journey-screen fixed inset-0 z-[500] overflow-y-auto overflow-x-hidden">
      <FinalJourneyConfetti />
      <StampRoughFilter />

      <main className="final-journey-content">
        <p className="final-journey-kicker">HANJAPOP GRAND FINALE</p>

        <FinalJourneyHero
          characterImage={characterImage}
          selectedCharacter={selectedCharacter}
        />
        <FinalJourneyHeading userNickname={userNickname} />
        <FinalJourneyRewards />
        <FinalJourneyCertificate
          userNickname={userNickname}
          hanjaCount={hanjaCount}
          completedDate={completedDate}
        />
        <FinalJourneyActions
          claiming={claiming}
          shareStatus={shareStatus}
          onShare={handleShare}
          onClaim={handleClaim}
        />
      </main>
    </div>
  );
};

export default FinalJourneyCelebration;
