import { lazy, Suspense } from 'react';
import { updateRecord } from '../../../utils/recordUtils.js';

const MatchGameScreen = lazy(() => import('../../games/MatchGameScreen.jsx'));

const DailyMatchGameStage = ({
    addBonusXp,
    addTodayStat,
    contentPool,
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
    onWordCorrect,
    onWordSeen,
    seenHanjaIds,
    seenWordIds,
    srsData,
    trackMission,
}) => {
    const handleWordSeen = (wordId) => {
        markWordSeen([wordId]);
        if (onWordSeen) onWordSeen(wordId);
    };

    return (
        <Suspense fallback={<div className="min-h-screen " />}>
            <MatchGameScreen
                autoStart={true}
                hideRetry={true}
                dailyMapNode={dailyMapNode}
                onBack={onBack}
                onGameFinish={() => finishSession()}
                contentPool={contentPool}
                onHanjaAcquired={onHanjaAcquired}
                onStageClear={(round, elapsedSec, matches = 0) => {
                    trackMission('matchGame', 1, addBonusXp);
                    if (onHanjaAcquired) onHanjaAcquired(null, 20 + matches * 3);
                    if (addTodayStat) addTodayStat('matchGame');
                    if (elapsedSec != null) updateRecord('matchBestTime', elapsedSec);
                }}
                missionDone={missions?.find((mission) => mission.type === 'matchGame')?.done ?? false}
                onMarkCorrect={(id) => onMarkCorrect(id)}
                onMarkWrong={() => {}}
                srsData={srsData}
                masteryData={masteryData}
                getRewardPreview={getRewardPreview}
                seenHanjaIds={seenHanjaIds}
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

export default DailyMatchGameStage;
