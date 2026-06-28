import { updateRecord } from '../../../utils/recordUtils.js';
import { MatchGameScreen, ShootGameScreen } from '../../appScreens.js';

const GameRoutes = ({
    addBonusXp,
    addTodayStat,
    backToMain,
    clearedHanjaIds,
    currentDay,
    currentDayHanjaIds,
    currentLevel,
    currentScreen,
    effectivePool,
    getNextHanjaIds,
    getNextWordIds,
    getRewardPreview,
    handleHanjaAcquired,
    hanjaData,
    isPremium,
    logCorrectWord,
    logHanja,
    logWrongWord,
    markCorrect,
    markWordCorrect,
    markWordWrong,
    missions,
    selectedCharacter,
    updateMissionProgress,
    userXp,
}) => {
    if (currentScreen === 'matchGame') {
        return <MatchGameScreen
            onBack={backToMain}
            onHanjaAcquired={handleHanjaAcquired}
            onStageClear={(round, elapsedSec, matches = 0) => {
                handleHanjaAcquired(null, 20 + matches * 3);
                updateMissionProgress('matchGame', 1, addBonusXp);
                addTodayStat('matchGame');
                if (elapsedSec != null) updateRecord('matchBestTime', elapsedSec);
            }}
            onMarkCorrect={(id) => { markCorrect(id); logHanja(id); }}
            onMarkWrong={() => {}}
            srsData={hanjaData}
            masteryData={hanjaData}
            userLevel={currentLevel}
            userXp={userXp}
            selectedCharacter={selectedCharacter}
            getRewardPreview={getRewardPreview}
            isPremium={isPremium}
            unlockedHanjaIds={clearedHanjaIds.length > 0 ? clearedHanjaIds : null}
            currentDayHanjaIds={currentDayHanjaIds}
            contentPool={effectivePool}
            onGetNextHanjaIds={getNextHanjaIds}
            onGetNextWordIds={getNextWordIds}
            missionDone={missions?.find(m => m.type === 'matchGame')?.done ?? false}
        />;
    }

    if (currentScreen !== 'shootGame') return null;

    return <ShootGameScreen
        onBack={backToMain}
        missionDone={missions?.find(m => m.type === 'shootGame')?.done ?? false}
        onHanjaAcquired={handleHanjaAcquired}
        selectedCharacter={selectedCharacter}
        onWaveClear={(kills) => {
            updateMissionProgress('shootGame', 1, addBonusXp);
            addTodayStat('shootGame');
            if (kills) updateRecord('totalMonsterKills', kills);
        }}
        onMarkWrong={() => {}}
        onMarkCorrect={(id) => { markCorrect(id); logHanja(id); }}
        onWordCorrect={(wordId) => { logCorrectWord(wordId); markWordCorrect(wordId); }}
        onWordWrong={(wordId, hanjaId, reading, meaning) => { logWrongWord(wordId); markWordWrong(wordId, hanjaId, reading, meaning); }}
        masteryData={hanjaData}
        srsData={hanjaData}
        userLevel={currentLevel}
        getRewardPreview={getRewardPreview}
        isPremium={isPremium}
        unlockedHanjaIds={clearedHanjaIds.length > 0 ? clearedHanjaIds : null}
        currentDayHanjaIds={currentDayHanjaIds}
        currentDay={currentDay}
        contentPool={effectivePool}
        sharedPoolMode={!!effectivePool}
        onGetNextHanjaIds={getNextHanjaIds}
        onGetNextWordIds={getNextWordIds}
    />;
};

export default GameRoutes;
