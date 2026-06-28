import { buildOopsPool } from '../../../../utils/learningPool.js';
import { updateRecord } from '../../../../utils/recordUtils.js';
import { hasPassedQuizMission } from '../../../appConstants.js';
import { WordQuizScreen } from '../../../appScreens.js';

const WordQuizRoute = ({
  addBonusXp,
  addMainSeenWords,
  addTodayStat,
  backToMain,
  clearedHanjaIds,
  currentLevel,
  effectivePool,
  getNextWordIds,
  getRewardPreview,
  gradeWordCount,
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
  <WordQuizScreen
    onBack={backToMain}
    onStageClear={(correct, total, maxCombo, newSeenWords) => {
      if (newSeenWords) addMainSeenWords(newSeenWords);
      handleHanjaAcquired(null, 20 + correct * 5);
      if (hasPassedQuizMission(correct, total)) {
        updateMissionProgress('wordQuiz', 1, addBonusXp);
      }
      addTodayStat('wordQuiz');
      updateRecord('wordBestScore', correct);
      if (maxCombo) updateRecord('wordMaxCombo', maxCombo);
    }}
    onHanjaAcquired={handleHanjaAcquired}
    onWordCorrect={(wordId) => { logCorrectWord(wordId); markWordCorrect(wordId); }}
    onWordSeen={(wordId) => addMainSeenWords([wordId])}
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
    contentPool={effectivePool}
    onGetNextWordIds={getNextWordIds}
    quizCount={selectedGrade ? gradeWordCount : 6}
    clearXp={20}
  />
);

export default WordQuizRoute;
