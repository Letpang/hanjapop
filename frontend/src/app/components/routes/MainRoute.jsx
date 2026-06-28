import { canAccessStage } from '../../../utils/premiumAccess.js';
import { MainMenu } from '../../appScreens.js';

const MainRoute = ({
    archivedCompletedDay,
    clearedHanjaIds,
    completedDay,
    currentDay,
    doneCount,
    hanjaData,
    isDarkMode,
    isJourneyComplete,
    journeyRound,
    missions,
    openMemoryVaultSignal,
    selectedCharacter,
    selectedGrade,
    selectedPastStage,
    setCurrentScreen,
    setIsDarkMode,
    setSelectedGrade,
    setSelectedPastStage,
    setSessionDoneToday,
    setShowNewJourneyModal,
    setShowPremiumModal,
    streak,
    unlockedHanjaCount,
    unlockedPack,
    userNickname,
    userXp,
}) => (
    <MainMenu
        onNavigate={setCurrentScreen}
        userXp={userXp}
        selectedCharacter={selectedCharacter}
        userNickname={userNickname}
        missions={missions}
        doneCount={doneCount}
        mastery={hanjaData}
        currentDay={currentDay}
        completedDay={completedDay}
        archivedCompletedDay={archivedCompletedDay}
        journeyRound={journeyRound}
        isJourneyComplete={isJourneyComplete}
        onOpenNewJourney={() => setShowNewJourneyModal(true)}
        openMemoryVaultSignal={openMemoryVaultSignal}
        onStartNextStage={() => {
            if (!selectedGrade) {
                const targetStage = selectedPastStage || (completedDay + 1);
                if (!canAccessStage(unlockedPack, targetStage)) {
                    setShowPremiumModal(true);
                    return;
                }
            }
            if (!selectedPastStage && !selectedGrade) {
                const nextStage = completedDay + 1;
                const missionKey = journeyRound > 1
                    ? `stage_missions_r${journeyRound}_${nextStage}`
                    : `stage_missions_${nextStage}`;
                try { localStorage.removeItem(missionKey); } catch {}
            }
            setCurrentScreen('flashcard');
            setSessionDoneToday(false);
        }}
        onSelectPastStage={(n) => { setSelectedGrade(null); setSelectedPastStage(n); }}
        selectedPastStage={selectedPastStage}
        onSelectGrade={(g) => { setSelectedPastStage(null); setSelectedGrade(g); }}
        selectedGrade={selectedGrade}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        streak={streak}
        unlockedHanjaCount={clearedHanjaIds?.length || 0}
    />
);

export default MainRoute;
