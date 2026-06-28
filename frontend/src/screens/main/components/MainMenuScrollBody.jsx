import DailyQuestBoard from './DailyQuestBoard.jsx';
import ExamPrepShortcuts from './ExamPrepShortcuts.jsx';
import ExplorerProfileCard from './ExplorerProfileCard.jsx';
import JourneyCtaPanel from './JourneyCtaPanel.jsx';
import MemoryVaultButton from './MemoryVaultButton.jsx';

const MainMenuScrollBody = ({
    allDone,
    archivedCompletedDay,
    currentDay,
    entranceStyle,
    handlePrimaryCta,
    isDailyComplete,
    isDarkMode,
    isJourneyComplete,
    isStageLocked,
    journeyRound,
    missionDone,
    missionTotal,
    missions,
    onNavigate,
    onSelectGrade,
    selectedCharacter,
    selectedGrade,
    selectedPastStage,
    setShowModal,
    targetStage,
    userNickname,
    userXp,
}) => (
    <div
        className="flex-1 overflow-y-auto w-full flex flex-col items-center px-5 pt-2 gap-7 relative z-10"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 7rem)' }}
    >
        <ExplorerProfileCard
            userNickname={userNickname}
            userXp={userXp}
            selectedCharacter={selectedCharacter}
            isDarkMode={isDarkMode}
            onNavigate={onNavigate}
            style={entranceStyle(0)}
        />

        <JourneyCtaPanel
            selectedGrade={selectedGrade}
            selectedPastStage={selectedPastStage}
            isDailyComplete={isDailyComplete}
            isStageLocked={isStageLocked}
            isJourneyComplete={isJourneyComplete}
            journeyRound={journeyRound}
            currentDay={currentDay}
            targetStage={targetStage}
            isDarkMode={isDarkMode}
            onSelectGrade={onSelectGrade}
            onPrimaryCta={handlePrimaryCta}
            style={entranceStyle(0.08)}
        />

        <DailyQuestBoard
            missions={missions}
            missionDone={missionDone}
            missionTotal={missionTotal}
            allDone={allDone}
            onNavigate={onNavigate}
            style={entranceStyle(0.15)}
        />

        <ExamPrepShortcuts onNavigate={onNavigate} style={entranceStyle(0.18)} />

        <MemoryVaultButton
            archivedCompletedDay={archivedCompletedDay}
            journeyRound={journeyRound}
            isJourneyComplete={isJourneyComplete}
            onOpen={() => setShowModal(true)}
            style={entranceStyle(0.20)}
        />
    </div>
);

export default MainMenuScrollBody;
