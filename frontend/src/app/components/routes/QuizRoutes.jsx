import IdiomQuizRoute from './quiz/IdiomQuizRoute.jsx';
import SentenceQuizRoute from './quiz/SentenceQuizRoute.jsx';
import WordQuizRoute from './quiz/WordQuizRoute.jsx';

const QuizRoutes = ({
    activeStage,
    addBonusXp,
    addMainSeenWords,
    addTodayStat,
    backToMain,
    clearedHanjaIds,
    currentDayHanjaIds,
    currentLevel,
    currentScreen,
    effectivePool,
    getNextWordIds,
    getRewardPreview,
    gradeSentenceCount,
    gradeWordCount,
    handleHanjaAcquired,
    hanjaData,
    isPremium,
    logCorrectWord,
    logWrongWord,
    markWordCorrect,
    markWordWrong,
    missions,
    selectedCharacter,
    selectedGrade,
    setCurrentScreen,
    setSessionReviewPool,
    updateMissionProgress,
    userXp,
    wordData,
}) => {
    if (currentScreen === 'sentenceQuiz') {
        return <SentenceQuizRoute
            addBonusXp={addBonusXp}
            addMainSeenWords={addMainSeenWords}
            addTodayStat={addTodayStat}
            backToMain={backToMain}
            clearedHanjaIds={clearedHanjaIds}
            currentDayHanjaIds={currentDayHanjaIds}
            currentLevel={currentLevel}
            effectivePool={effectivePool}
            getNextWordIds={getNextWordIds}
            getRewardPreview={getRewardPreview}
            gradeSentenceCount={gradeSentenceCount}
            handleHanjaAcquired={handleHanjaAcquired}
            hanjaData={hanjaData}
            isPremium={isPremium}
            logCorrectWord={logCorrectWord}
            logWrongWord={logWrongWord}
            markWordCorrect={markWordCorrect}
            markWordWrong={markWordWrong}
            selectedCharacter={selectedCharacter}
            selectedGrade={selectedGrade}
            setCurrentScreen={setCurrentScreen}
            setSessionReviewPool={setSessionReviewPool}
            updateMissionProgress={updateMissionProgress}
            userXp={userXp}
            wordData={wordData}
        />;
    }

    if (currentScreen === 'wordQuiz') {
        return <WordQuizRoute
            addBonusXp={addBonusXp}
            addMainSeenWords={addMainSeenWords}
            addTodayStat={addTodayStat}
            backToMain={backToMain}
            clearedHanjaIds={clearedHanjaIds}
            currentLevel={currentLevel}
            effectivePool={effectivePool}
            getNextWordIds={getNextWordIds}
            getRewardPreview={getRewardPreview}
            gradeWordCount={gradeWordCount}
            handleHanjaAcquired={handleHanjaAcquired}
            hanjaData={hanjaData}
            isPremium={isPremium}
            logCorrectWord={logCorrectWord}
            logWrongWord={logWrongWord}
            markWordCorrect={markWordCorrect}
            markWordWrong={markWordWrong}
            selectedCharacter={selectedCharacter}
            selectedGrade={selectedGrade}
            setCurrentScreen={setCurrentScreen}
            setSessionReviewPool={setSessionReviewPool}
            updateMissionProgress={updateMissionProgress}
            userXp={userXp}
            wordData={wordData}
        />;
    }

    if (currentScreen !== 'idiomQuiz') return null;

    return <IdiomQuizRoute
        activeStage={activeStage}
        addBonusXp={addBonusXp}
        backToMain={backToMain}
        effectivePool={effectivePool}
        getRewardPreview={getRewardPreview}
        handleHanjaAcquired={handleHanjaAcquired}
        missions={missions}
        selectedCharacter={selectedCharacter}
        selectedGrade={selectedGrade}
        updateMissionProgress={updateMissionProgress}
        userXp={userXp}
    />;
};

export default QuizRoutes;
