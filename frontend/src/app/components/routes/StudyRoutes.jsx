import { StudyHistoryScreen } from '../../appScreens.js';
import FlashcardRoute from './study/FlashcardRoute.jsx';
import ReviewRoute from './study/ReviewRoute.jsx';
import WritingRoute from './study/WritingRoute.jsx';

const StudyRoutes = ({
    addBonusXp,
    addTodayStat,
    backToMain,
    clearWordWrong,
    clearWrong,
    clearedHanjaIds,
    currentDay,
    currentLevel,
    currentScreen,
    effectivePool,
    getRewardPreview,
    handleHanjaAcquired,
    hanjaData,
    isDarkMode,
    isPremium,
    logCorrectWord,
    logHanja,
    logWrongWord,
    markCorrect,
    markSeen,
    markWordCorrect,
    markWordWrong,
    markWrong,
    selectedCharacter,
    sessionReviewPool,
    setCurrentScreen,
    setSessionReviewPool,
    setWriteTargetHanja,
    updateMissionProgress,
    userXp,
    wordData,
    writeTargetHanja,
}) => {
    if (currentScreen === 'flashcard') {
        return <FlashcardRoute
            addBonusXp={addBonusXp}
            addTodayStat={addTodayStat}
            backToMain={backToMain}
            clearedHanjaIds={clearedHanjaIds}
            currentDay={currentDay}
            effectivePool={effectivePool}
            getRewardPreview={getRewardPreview}
            handleHanjaAcquired={handleHanjaAcquired}
            isPremium={isPremium}
            logHanja={logHanja}
            logWrongWord={logWrongWord}
            markCorrect={markCorrect}
            markSeen={markSeen}
            markWordWrong={markWordWrong}
            markWrong={markWrong}
            selectedCharacter={selectedCharacter}
            setCurrentScreen={setCurrentScreen}
            setWriteTargetHanja={setWriteTargetHanja}
            updateMissionProgress={updateMissionProgress}
            userXp={userXp}
        />;
    }

    if (currentScreen === 'writing') {
        return <WritingRoute
            addBonusXp={addBonusXp}
            addTodayStat={addTodayStat}
            backToMain={backToMain}
            clearedHanjaIds={clearedHanjaIds}
            effectivePool={effectivePool}
            getRewardPreview={getRewardPreview}
            handleHanjaAcquired={handleHanjaAcquired}
            isPremium={isPremium}
            logHanja={logHanja}
            markCorrect={markCorrect}
            markSeen={markSeen}
            markWrong={markWrong}
            selectedCharacter={selectedCharacter}
            setWriteTargetHanja={setWriteTargetHanja}
            updateMissionProgress={updateMissionProgress}
            userXp={userXp}
            writeTargetHanja={writeTargetHanja}
        />;
    }

    if (currentScreen === 'calendar') {
        return <StudyHistoryScreen
            onBack={() => setCurrentScreen('mypage')}
            isDarkMode={isDarkMode}
        />;
    }

    if (currentScreen !== 'review') return null;

    return <ReviewRoute
        clearWordWrong={clearWordWrong}
        clearWrong={clearWrong}
        currentLevel={currentLevel}
        hanjaData={hanjaData}
        handleHanjaAcquired={handleHanjaAcquired}
        isPremium={isPremium}
        logCorrectWord={logCorrectWord}
        logHanja={logHanja}
        markCorrect={markCorrect}
        markWordCorrect={markWordCorrect}
        selectedCharacter={selectedCharacter}
        sessionReviewPool={sessionReviewPool}
        setCurrentScreen={setCurrentScreen}
        setSessionReviewPool={setSessionReviewPool}
        userXp={userXp}
        wordData={wordData}
    />;
};

export default StudyRoutes;
