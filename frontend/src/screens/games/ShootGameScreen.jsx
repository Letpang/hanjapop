import ShootIdleScreen from './shoot/components/ShootIdleScreen.jsx';
import ShootLoadingScreen from './shoot/components/ShootLoadingScreen.jsx';
import ShootPlayView from './shoot/components/ShootPlayView.jsx';
import { useShootGameEngine } from './shoot/hooks/useShootGameEngine.js';

const ShootGameScreen = (props) => {
    const game = useShootGameEngine(props);

    if (game.status === 'loading') {
        return <ShootLoadingScreen themeConfig={game.themeConfig} />;
    }

    if (game.status === 'idle') {
        return (
            <ShootIdleScreen
                onBack={props.onBack}
                viewMode={game.viewMode}
                onViewModeChange={game.setViewMode}
                selectedGrade={game.selectedGrade}
                onSelectGrade={game.setSelectedGrade}
                unlockedGrades={game.unlockedGrades}
                categories={game.categories}
                selectedCategory={game.selectedCategory}
                onSelectCategory={game.setSelectedCategory}
                unlockedIds={game.unlockedIds}
                characterAvatar={game.characterAvatar}
                onStartGame={() => game.startGame(game.selectedDifficulty)}
            />
        );
    }

    return (
        <ShootPlayView
            acquisitions={game.acquisitions}
            characterAvatar={game.characterAvatar}
            dailyMapNode={props.dailyMapNode}
            diffConfig={game.diffConfig}
            handleExitConfirm={game.handleExitConfirm}
            hideRetry={game.hideRetry}
            hp={game.hp}
            isClear={game.isClear}
            isInputLocked={game.isInputLocked}
            isPaused={game.isPaused}
            isResult={game.isResult}
            isWordTarget={game.isWordTarget}
            killXp={game.killXp}
            lasers={game.lasers}
            missionXp={game.missionXp}
            onExitCancel={game.setShowExitModal}
            onOptionClick={game.handleOptionClick}
            onPause={() => game.setIsPaused(true)}
            onPauseExit={() => {
                game.setIsPaused(false);
                game.setShowExitModal(true);
            }}
            onResume={() => game.setIsPaused(false)}
            onResultContinue={game.handleResultContinue}
            onResultRetry={game.handleResultRetry}
            onResultReturn={game.handleResultReturn}
            options={game.options}
            reward={game.reward}
            resultClearMsg={game.resultClearMsg}
            score={game.score}
            selectedCharacter={props.selectedCharacter}
            shake={game.shake}
            shootClearXp={game.shootClearXp}
            showExitModal={game.showExitModal}
            targetId={game.targetId}
            themeConfig={game.themeConfig}
            turretAngle={game.turretAngle}
            waveKills={game.waveKills}
            words={game.words}
            xpPopup={game.xpPopup}
        />
    );
};

export default ShootGameScreen;
