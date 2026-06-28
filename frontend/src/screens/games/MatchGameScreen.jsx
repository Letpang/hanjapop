import MatchAllClearOverlay from './match/components/MatchAllClearOverlay.jsx';
import MatchGamePlayView from './match/components/MatchGamePlayView.jsx';
import MatchStartScreen from './match/components/MatchStartScreen.jsx';
import { useMatchGameEngine } from './match/hooks/useMatchGameEngine.js';

const MatchGameScreen = (props) => {
    const game = useMatchGameEngine(props);

    if (game.gameStarted && game.gameState === 'allClear') {
        return (
            <MatchAllClearOverlay
                contentPool={props.contentPool}
                onBack={props.onBack}
                onReset={game.resetToIdle}
                selectedCategory={game.selectedCategory}
                selectedCharacter={props.selectedCharacter}
                selectedGrade={game.selectedGrade}
                totalRounds={game.totalRounds}
                viewMode={game.viewMode}
            />
        );
    }

    if (game.gameStarted) {
        return (
            <MatchGamePlayView
                backChar={game.cardBackChar}
                backSrc={game.cardBackSrc}
                cards={game.cards}
                clearCount={game.clearCount}
                clearXp={game.clearXp}
                contentPool={props.contentPool}
                currentRound={game.currentRound}
                dailyMapNode={props.dailyMapNode}
                gameState={game.gameState}
                handleExitConfirm={game.handleExitConfirm}
                hideRetry={props.hideRetry}
                isPaused={game.isPaused}
                matchXp={game.matchXp}
                matches={game.matches}
                missionDoneAtStart={game.missionDoneAtStart}
                onBack={game.handlePlayBack}
                onCardClick={game.handleCardClick}
                onContinueRound={game.goNextRound}
                onDeliverStageClear={game.deliverStageClear}
                onGameFinish={props.onGameFinish}
                onRetry={game.handleRetry}
                onSetExitModal={game.setShowExitModal}
                onSetPaused={game.setIsPaused}
                resultClearMsg={game.resultClearMsg}
                reward={game.reward}
                selectedCharacter={props.selectedCharacter}
                showExitModal={game.showExitModal}
                timeLeft={game.timeLeft}
                totalRounds={game.totalRounds}
                xpPerMatch={game.xpPerMatch}
                xpPopup={game.xpPopup}
            />
        );
    }

    return (
        <MatchStartScreen
            categories={game.categories}
            characterAvatar={game.characterAvatar}
            dailyMapNode={props.dailyMapNode}
            onBack={props.onBack}
            onExitCancel={() => game.setShowExitModal(false)}
            onExitConfirm={game.handleExitConfirm}
            onSelectCategory={game.setSelectedCategory}
            onSelectGrade={game.setSelectedGrade}
            onSetViewMode={game.setViewMode}
            onStart={() => game.startGame()}
            selectedCategory={game.selectedCategory}
            selectedCharacter={props.selectedCharacter}
            selectedGrade={game.selectedGrade}
            showExitModal={game.showExitModal}
            unlockedGrades={game.unlockedGrades}
            unlockedIds={game.unlockedIds}
            viewMode={game.viewMode}
        />
    );
};

export default MatchGameScreen;
