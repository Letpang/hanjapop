import DailyMatchGameStage from './DailyMatchGameStage.jsx';
import DailyShootGameStage from './DailyShootGameStage.jsx';

const DailyGameStage = ({
    gameType,
    dailyMapNode,
    onBack,
    finishSession,
    contentPool,
    selectedCharacter,
    missions,
    getRewardPreview,
    onHanjaAcquired,
    onMarkCorrect,
    onMarkWordWrong,
    onWordCorrect,
    srsData,
    masteryData,
    currentDay,
    seenHanjaIds,
    seenWordIds,
    markHanjaSeen,
    markWordSeen,
    onWordSeen,
    trackMission,
    addBonusXp,
    addTodayStat,
}) => (
    gameType === 'match'
        ? <DailyMatchGameStage
            addBonusXp={addBonusXp}
            addTodayStat={addTodayStat}
            contentPool={contentPool}
            dailyMapNode={dailyMapNode}
            finishSession={finishSession}
            getRewardPreview={getRewardPreview}
            markHanjaSeen={markHanjaSeen}
            markWordSeen={markWordSeen}
            masteryData={masteryData}
            missions={missions}
            onBack={onBack}
            onHanjaAcquired={onHanjaAcquired}
            onMarkCorrect={onMarkCorrect}
            onWordCorrect={onWordCorrect}
            onWordSeen={onWordSeen}
            seenHanjaIds={seenHanjaIds}
            seenWordIds={seenWordIds}
            srsData={srsData}
            trackMission={trackMission}
        />
        : <DailyShootGameStage
            addBonusXp={addBonusXp}
            addTodayStat={addTodayStat}
            contentPool={contentPool}
            currentDay={currentDay}
            dailyMapNode={dailyMapNode}
            finishSession={finishSession}
            getRewardPreview={getRewardPreview}
            markHanjaSeen={markHanjaSeen}
            markWordSeen={markWordSeen}
            masteryData={masteryData}
            missions={missions}
            onBack={onBack}
            onHanjaAcquired={onHanjaAcquired}
            onMarkCorrect={onMarkCorrect}
            onMarkWordWrong={onMarkWordWrong}
            onWordCorrect={onWordCorrect}
            onWordSeen={onWordSeen}
            seenWordIds={seenWordIds}
            selectedCharacter={selectedCharacter}
            srsData={srsData}
            trackMission={trackMission}
        />
);

export default DailyGameStage;
