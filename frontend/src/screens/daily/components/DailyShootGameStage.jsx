import { lazy, Suspense } from 'react';
import { updateRecord } from '../../../utils/recordUtils.js';

const ShootGameScreen = lazy(() => import('../../games/ShootGameScreen.jsx'));

const DailyShootGameStage = ({
    addBonusXp,
    addTodayStat,
    contentPool,
    currentDay,
    dailyMapNode,
    finishSession,
    getRewardPreview,
    markHanjaSeen,
    markWordSeen,
    masteryData,
    missions,
    onBack,
    onHanjaAcquired,
    onMarkCorrect,
    onMarkWordWrong,
    onWordCorrect,
    onWordSeen,
    seenWordIds,
    selectedCharacter,
    srsData,
    trackMission,
}) => {
    const handleWordSeen = (wordId) => {
        markWordSeen([wordId]);
        if (onWordSeen) onWordSeen(wordId);
    };

    return (
        <Suspense fallback={<div className="min-h-screen " />}>
            <ShootGameScreen
                autoStart={true}
                hideRetry={true}
                dailyMapNode={dailyMapNode}
                onBack={onBack}
                missionDone={missions?.find((mission) => mission.type === 'shootGame')?.done ?? false}
                getRewardPreview={getRewardPreview}
                onHanjaAcquired={onHanjaAcquired}
                onGameFinish={() => {
                    trackMission('shootGame', 1, addBonusXp);
                    finishSession();
                }}
                contentPool={contentPool}
                selectedCharacter={selectedCharacter}
                onWaveClear={(kills) => {
                    if (addTodayStat) addTodayStat('shootGame');
                    if (kills) updateRecord('totalMonsterKills', kills);
                }}
                onMarkCorrect={(id) => onMarkCorrect(id)}
                onMarkWrong={() => {}}
                onWordWrong={(wordId, hanjaId, reading, meaning) => {
                    if (onMarkWordWrong) onMarkWordWrong(wordId, hanjaId, reading, meaning);
                }}
                masteryData={masteryData}
                srsData={srsData}
                currentDay={currentDay}
                onHanjaSeen={(ids) => markHanjaSeen(ids)}
                seenWordIds={seenWordIds}
                onWordSeen={handleWordSeen}
                onWordCorrect={(wordId) => {
                    if (onWordCorrect) onWordCorrect(wordId);
                }}
            />
        </Suspense>
    );
};

export default DailyShootGameStage;
