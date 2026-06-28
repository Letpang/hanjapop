import PauseOverlay from './PauseOverlay.jsx';
import ShootGameArena from './ShootGameArena.jsx';
import ShootGameHud from './ShootGameHud.jsx';
import ShootOptionsGrid from './ShootOptionsGrid.jsx';
import ShootResultOverlay from './ShootResultOverlay.jsx';

const ShootPlayStage = ({
    acquisitions,
    characterAvatar,
    dailyMapNode,
    diffConfig,
    hideRetry,
    hp,
    isClear,
    isInputLocked,
    isPaused,
    isResult,
    isWordTarget,
    killXp,
    lasers,
    missionXp,
    onExitCancel,
    onOptionClick,
    onPause,
    onPauseExit,
    onResume,
    onResultContinue,
    onResultRetry,
    onResultReturn,
    options,
    reward,
    resultClearMsg,
    score,
    selectedCharacter,
    shake,
    shootClearXp,
    targetId,
    themeConfig,
    turretAngle,
    waveKills,
    words,
}) => (
    <div className={`w-full mx-auto h-full flex flex-col relative ${shake ? 'animate-shake' : ''}`}>
        <ShootGameHud
            diffConfig={diffConfig}
            hp={hp}
            waveKills={waveKills}
            score={score}
            themeConfig={themeConfig}
            onPause={onPause}
            onExit={() => onExitCancel(true)}
        />

        <ShootGameArena
            acquisitions={acquisitions}
            characterAvatar={characterAvatar}
            lasers={lasers}
            selectedCharacter={selectedCharacter}
            targetId={targetId}
            turretAngle={turretAngle}
            words={words}
        />

        <ShootOptionsGrid
            isInputLocked={isInputLocked}
            isWordTarget={isWordTarget}
            onOptionClick={onOptionClick}
            options={options}
        />

        {isPaused && <PauseOverlay onResume={onResume} onExit={onPauseExit} />}

        {isResult && (
            <ShootResultOverlay
                isClear={isClear}
                dailyMapNode={dailyMapNode}
                resultClearMsg={resultClearMsg}
                selectedCharacter={selectedCharacter}
                reward={reward}
                killXp={killXp}
                shootClearXp={shootClearXp}
                score={score}
                missionXp={missionXp}
                hideRetry={hideRetry}
                onRetry={onResultRetry}
                onContinue={onResultContinue}
                onReturn={onResultReturn}
            />
        )}
    </div>
);

export default ShootPlayStage;
