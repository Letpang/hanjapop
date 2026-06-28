import { lazy, Suspense } from 'react';
import { SHOOT_CONTENT_POOL } from '../onboardingData.js';

const ShootGameScreen = lazy(() => import('../../games/ShootGameScreen.jsx'));
const MatchGameScreen = lazy(() => import('../../games/MatchGameScreen.jsx'));

const fallback = <div className="flex min-h-[100dvh] items-center justify-center bg-[#F7FAF9]" />;

const OnboardingPracticeGame = ({ game, onDone, selectedCharacter }) => {
  const character = selectedCharacter || 'garae';

  if (game === 'shoot') {
    return (
      <Suspense fallback={fallback}>
        <ShootGameScreen
          onBack={onDone}
          onGameFinish={onDone}
          contentPool={SHOOT_CONTENT_POOL}
          masteryData={{}}
          srsData={{}}
          selectedCharacter={character}
          hideRetry
          killsPerWaveOverride={6}
          avatarOverride={`/assets/images/characters/${character}/rank_5.webp`}
        />
      </Suspense>
    );
  }

  if (game === 'match') {
    return (
      <Suspense fallback={fallback}>
        <MatchGameScreen
          onBack={onDone}
          onGameFinish={onDone}
          contentPool={SHOOT_CONTENT_POOL}
          masteryData={{}}
          srsData={{}}
          userXp={999999}
          selectedCharacter={character}
          hideRetry
          pairsPerRoundOverride={3}
        />
      </Suspense>
    );
  }

  return null;
};

export default OnboardingPracticeGame;
