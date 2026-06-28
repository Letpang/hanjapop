import { getMockTestScreenId } from '../../appConstants.js';
import {
    GradeExamSelectScreen,
    GradeStudyDashboardScreen,
    GradeTestScreen,
    GradeTest72Screen,
    GradeTest7Screen,
    GradeTest62Screen,
    GradeTest6Screen,
    LevelTestScreen,
} from '../../appScreens.js';

const TEST_ROUTES = {
    gradeTest: [GradeTestScreen, 200],
    gradeTest72: [GradeTest72Screen, 300],
    gradeTest7: [GradeTest7Screen, 400],
    gradeTest62: [GradeTest62Screen, 500],
    gradeTest6: [GradeTest6Screen, 600],
};

const GradeRoutes = ({
    clearedHanjaIds,
    currentScreen,
    gradeTestBackScreen,
    handleHanjaAcquired,
    hanjaData,
    selectedCharacter,
    selectedDashboardGrade,
    setCurrentScreen,
    setGradeTestBackScreen,
    setSelectedDashboardGrade,
    setSelectedGrade,
    setShowPremiumModal,
    setWriteTargetHanja,
    unlockedPack,
    userXp,
}) => {
    const testRoute = TEST_ROUTES[currentScreen];
    if (testRoute) {
        const [TestScreen, xp] = testRoute;
        return <TestScreen
            onBack={() => setCurrentScreen(gradeTestBackScreen)}
            selectedCharacter={selectedCharacter}
            userXp={userXp}
            onComplete={({ passed }) => { if (passed) handleHanjaAcquired(null, xp); }}
        />;
    }

    if (currentScreen === 'gradeExamSelect') {
        return <GradeExamSelectScreen
            onBack={() => setCurrentScreen('main')}
            onSelectGrade={(gradeName) => {
                setSelectedDashboardGrade(gradeName);
                setCurrentScreen('gradeStudyDashboard');
            }}
        />;
    }

    if (currentScreen === 'gradeStudyDashboard') {
        return <GradeStudyDashboardScreen
            grade={selectedDashboardGrade}
            onBack={() => {
                setSelectedGrade(null);
                setSelectedDashboardGrade(null);
                setCurrentScreen('gradeExamSelect');
            }}
            onStartFocusStudy={() => {
                setSelectedGrade(selectedDashboardGrade);
                setCurrentScreen('flashcard');
            }}
            onStartWordQuiz={() => {
                setSelectedGrade(selectedDashboardGrade);
                setCurrentScreen('wordQuiz');
            }}
            onStartSentenceQuiz={() => {
                setSelectedGrade(selectedDashboardGrade);
                setCurrentScreen('sentenceQuiz');
            }}
            onStartMockTest={() => {
                setGradeTestBackScreen('gradeStudyDashboard');
                setCurrentScreen(getMockTestScreenId(selectedDashboardGrade));
            }}
            unlockedPack={unlockedPack}
            onShowPremiumModal={() => setShowPremiumModal(true)}
            clearedHanjaIds={clearedHanjaIds}
            hanjaData={hanjaData}
            selectedCharacter={selectedCharacter}
            onWriteHanja={(hanja) => {
                setWriteTargetHanja(hanja);
                setGradeTestBackScreen('gradeStudyDashboard');
                setCurrentScreen('writing');
            }}
        />;
    }

    if (currentScreen !== 'levelTest') return null;

    return <LevelTestScreen
        onBack={() => setCurrentScreen('main')}
        onHanjaAcquired={handleHanjaAcquired}
        selectedCharacter={selectedCharacter}
        onComplete={({ correct, total }) => {
            const isPerfect = correct === total;
            const isPassed = correct >= 7;
            const ltXp = 20 + (isPassed ? 50 : 0) + (isPerfect ? 100 : 0);
            handleHanjaAcquired(null, ltXp);
        }}
    />;
};

export default GradeRoutes;
