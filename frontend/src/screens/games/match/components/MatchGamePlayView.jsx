import GameXpPopup from '../../shared/GameXpPopup.jsx';
import MatchExitConfirmModal from './MatchExitConfirmModal.jsx';
import MatchGameHeader from './MatchGameHeader.jsx';
import MatchPlayField from './MatchPlayField.jsx';
import MatchPauseOverlay from './MatchPauseOverlay.jsx';
import MatchResultOverlay from './MatchResultOverlay.jsx';
import { useLang } from '../../../../hooks/useLang.js';

export default function MatchGamePlayView({
    backChar,
    backSrc,
    cards,
    clearCount,
    clearXp,
    contentPool,
    currentRound,
    dailyMapNode,
    gameState,
    handleExitConfirm,
    hideRetry,
    isPaused,
    matchXp,
    matches,
    missionDoneAtStart,
    onBack,
    onCardClick,
    onContinueRound,
    onDeliverStageClear,
    onGameFinish,
    onRetry,
    onSetExitModal,
    onSetPaused,
    resultClearMsg,
    reward,
    selectedCharacter,
    showExitModal,
    timeLeft,
    totalRounds,
    xpPerMatch,
    xpPopup,
}) {
    const { t } = useLang();

    return (
        <div className="match-game-screen w-full h-[100dvh] flex flex-col  select-none">
            <GameXpPopup label={t('ext_1498')} popup={xpPopup} />

            <MatchGameHeader
                backLabel="✕"
                counter={`${currentRound + 1}/${totalRounds}`}
                onBack={() => onSetExitModal(true)}
                onPause={() => onSetPaused(true)}
                showPause={gameState === 'playing'}
            />

            <MatchPlayField
                backChar={backChar}
                backSrc={backSrc}
                cards={cards}
                gameState={gameState}
                onCardClick={onCardClick}
                timeLeft={timeLeft}
            />

            {isPaused && (
                <MatchPauseOverlay
                    onExit={() => { onSetPaused(false); onSetExitModal(true); }}
                    onResume={() => onSetPaused(false)}
                />
            )}

            {(gameState === 'clear' || gameState === 'over') && (
                <MatchResultOverlay
                    clearCount={clearCount}
                    clearXp={clearXp}
                    contentPool={contentPool}
                    dailyMapNode={dailyMapNode}
                    gameState={gameState}
                    hideRetry={hideRetry}
                    matchXp={matchXp}
                    matches={matches}
                    missionDoneAtStart={missionDoneAtStart}
                    onBack={onBack}
                    onContinue={onContinueRound}
                    onDeliverStageClear={onDeliverStageClear}
                    onGameFinish={onGameFinish}
                    onRetry={onRetry}
                    resultClearMsg={resultClearMsg}
                    reward={reward}
                    selectedCharacter={selectedCharacter}
                    xpPerMatch={xpPerMatch}
                />
            )}

            {showExitModal && (
                <MatchExitConfirmModal
                    dailyMapNode={dailyMapNode}
                    onCancel={() => onSetExitModal(false)}
                    onConfirm={handleExitConfirm}
                    selectedCharacter={selectedCharacter}
                />
            )}
        </div>
    );
}