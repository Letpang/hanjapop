import { buildOopsPool } from '../../../../utils/learningPool.js';
import { WrongReviewSession } from '../../../appScreens.js';
import EmptyReviewState from '../../EmptyReviewState.jsx';

const getWrongIds = (sessionReviewPool, hanjaData, wordData) => {
  if (sessionReviewPool) {
    return {
      hanjaIds: sessionReviewPool.main.hanjaIds,
      wordIds: sessionReviewPool.main.wordIds,
    };
  }

  return {
    hanjaIds: Object.entries(hanjaData).filter(([, meta]) => (meta.wrongCount || 0) > 0).map(([id]) => Number(id)),
    wordIds: Object.entries(wordData).filter(([, meta]) => (meta.wrongCount || 0) > 0).map(([id]) => Number(id)),
  };
};

const ReviewRoute = ({
  clearWordWrong,
  clearWrong,
  currentLevel,
  hanjaData,
  handleHanjaAcquired,
  isPremium,
  logCorrectWord,
  logHanja,
  markCorrect,
  markWordCorrect,
  selectedCharacter,
  sessionReviewPool,
  setCurrentScreen,
  setSessionReviewPool,
  userXp,
  wordData,
}) => {
  const { hanjaIds, wordIds } = getWrongIds(sessionReviewPool, hanjaData, wordData);

  if (hanjaIds.length === 0 && wordIds.length === 0) {
    return <EmptyReviewState onBack={() => setCurrentScreen('main')} />;
  }

  const reviewPool = buildOopsPool(hanjaIds, wordIds);

  return (
    <WrongReviewSession
      onBack={() => { setSessionReviewPool(null); setCurrentScreen('main'); }}
      onComplete={() => { setSessionReviewPool(null); setCurrentScreen('main'); }}
      onHanjaAcquired={handleHanjaAcquired}
      selectedCharacter={selectedCharacter}
      onClearAllWrong={() => {
        if (reviewPool?.main) {
          reviewPool.main.hanjaIds.forEach((id) => clearWrong(id));
          reviewPool.main.wordIds.forEach((id) => clearWordWrong(id));
        }
      }}
      onMarkCorrect={(id) => { markCorrect(id); logHanja(id); }}
      onWordCorrect={(wordId) => { logCorrectWord(wordId); markWordCorrect(wordId); }}
      masteryData={hanjaData}
      srsData={hanjaData}
      wordData={wordData}
      userLevel={currentLevel}
      userXp={userXp}
      contentPool={reviewPool}
      isPremium={isPremium}
    />
  );
};

export default ReviewRoute;
