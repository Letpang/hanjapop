import MainMenuBackground from './components/MainMenuBackground.jsx';
import MainHeader from './components/MainHeader.jsx';
import MainMenuScrollBody from './components/MainMenuScrollBody.jsx';
import StageSelectSheet from './components/StageSelectSheet.jsx';
import { FLOAT_CSS } from './constants.js';
import { useMainMenuState } from './hooks/useMainMenuState.js';

const MainMenuRenewal = ({
    userNickname,
    userXp,
    onNavigate,
    missions,
    doneCount,
    selectedCharacter,
    currentDay,
    completedDay = 0,
    archivedCompletedDay = completedDay,
    journeyRound = 1,
    isJourneyComplete = false,
    onOpenNewJourney,
    openMemoryVaultSignal = 0,
    onStartNextStage,
    onSelectPastStage,
    selectedPastStage,
    onSelectGrade,
    selectedGrade,
    isDarkMode,
    streak,
}) => {
    const {
        allDone,
        canAccessStage,
        entranceStyle,
        handlePrimaryCta,
        isDailyComplete,
        isStageLocked,
        missionDone,
        missionTotal,
        setShowModal,
        showModal,
        showPremiumGate,
        targetStage,
    } = useMainMenuState({
        missions,
        doneCount,
        currentDay,
        selectedPastStage,
        selectedGrade,
        isJourneyComplete,
        onOpenNewJourney,
        onStartNextStage,
        openMemoryVaultSignal,
    });

    return (
        <div className="main-menu-shell flex flex-col w-full max-w-[600px] mx-auto h-[100dvh] overflow-hidden relative" style={{ background: 'linear-gradient(to bottom right, var(--color-bg-gradient-start), var(--color-bg-gradient-end))' }}>
            <style>{FLOAT_CSS}</style>

            <MainMenuBackground />

            <MainHeader streak={streak} onNavigate={onNavigate} />

            <MainMenuScrollBody
                allDone={allDone}
                archivedCompletedDay={archivedCompletedDay}
                currentDay={currentDay}
                entranceStyle={entranceStyle}
                handlePrimaryCta={handlePrimaryCta}
                isDailyComplete={isDailyComplete}
                isDarkMode={isDarkMode}
                isJourneyComplete={isJourneyComplete}
                isStageLocked={isStageLocked}
                journeyRound={journeyRound}
                missionDone={missionDone}
                missionTotal={missionTotal}
                missions={missions}
                onNavigate={onNavigate}
                onSelectGrade={onSelectGrade}
                selectedCharacter={selectedCharacter}
                selectedGrade={selectedGrade}
                selectedPastStage={selectedPastStage}
                setShowModal={setShowModal}
                targetStage={targetStage}
                userNickname={userNickname}
                userXp={userXp}
            />

            <StageSelectSheet
                isOpen={showModal}
                isDarkMode={isDarkMode}
                selectedPastStage={selectedPastStage}
                selectedGrade={selectedGrade}
                archivedCompletedDay={archivedCompletedDay}
                showPremiumGate={showPremiumGate}
                canAccessStage={canAccessStage}
                onSelectPastStage={onSelectPastStage}
                onSelectGrade={onSelectGrade}
                onClose={() => setShowModal(false)}
            />

        </div>
    );
};

export default MainMenuRenewal;
