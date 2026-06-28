import { buildOopsPool } from '../../../../utils/learningPool.js';
import { hasPassedQuizMission } from '../../../appConstants.js';
import { SentenceQuizScreen } from '../../../appScreens.js';

const SentenceQuizRoute = ({
  addBonusXp,
  addMainSeenWords,
  addTodayStat,
  backToMain,
  clearedHanjaIds,
  currentDayHanjaIds,
  currentLevel,
  effectivePool,
  getNextWordIds,
  getRewardPreview,
  gradeSentenceCount,
  handleHanjaAcquired,
  hanjaData,
  isPremium,
  logCorrectWord,
  logWrongWord,
  markWordCorrect,
  markWordWrong,
  selectedCharacter,
  selectedGrade,
  setCurrentScreen,
  setSessionReviewPool,
  updateMissionProgress,
  userXp,
  wordData,
}) => (
  <SentenceQuizScreen
    onBack={backToMain}
    onStageClear={(correct, total, newSeenWords) => {
      if (newSeenWords) addMainSeenWords(newSeenWords);
      handleHanjaAcquired(null, 20 + correct * 10);
      if (hasPassedQuizMission(correct, total)) {
        updateMissionProgress('sentenceQuiz', 1, addBonusXp);
      }
      addTodayStat('sentenceQuiz');
    }}
    onHanjaAcquired={handleHanjaAcquired}
    onWordSeen={(wordId) => addMainSeenWords([wordId])}
    onWordCorrect={(wordId) => { logCorrectWord(wordId); markWordCorrect(wordId); }}
    onMarkWordWrong={(wordId, hanjaId, reading, meaning) => {
      markWordWrong(wordId, hanjaId, reading, meaning);
      logWrongWord(wordId);
    }}
    onGoToReview={(wrongIds) => {
      if (wrongIds) setSessionReviewPool(buildOopsPool(wrongIds.hanjaIds || [], wrongIds.wordIds || []));
      setCurrentScreen('review');
    }}
    srsData={hanjaData}
    masteryData={hanjaData}
    wordData={wordData}
    userLevel={currentLevel}
    userXp={userXp}
    selectedCharacter={selectedCharacter}
    getRewardPreview={getRewardPreview}
    isPremium={isPremium}
    unlockedHanjaIds={clearedHanjaIds.length > 0 ? clearedHanjaIds : null}
    currentDayHanjaIds={currentDayHanjaIds}
    contentPool={effectivePool}
    onGetNextWordIds={getNextWordIds}
    quizCount={selectedGrade ? gradeSentenceCount : 5}
    clearXp={20}
  />
);

export default SentenceQuizRoute;
