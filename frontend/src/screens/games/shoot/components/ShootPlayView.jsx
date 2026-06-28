import GameXpPopup from '../../shared/GameXpPopup.jsx';
import ExitConfirmModal from './ExitConfirmModal.jsx';
import ShootGameBackground from './ShootGameBackground.jsx';
import ShootPlayStage from './ShootPlayStage.jsx';
import { useLang } from '../../../../hooks/useLang.js';

export default function ShootPlayView({
    acquisitions,
    characterAvatar,
    dailyMapNode,
    diffConfig,
    handleExitConfirm,
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
    showExitModal,
    targetId,
    themeConfig,
    turretAngle,
    waveKills,
    words,
    xpPopup,
}) {
    const { t } = useLang();

    return (
        <>
            <div className={`fixed inset-0 w-full h-full z-50 flex flex-col overflow-hidden transition-all duration-1000 ease-out shoot-game-theme-container ${isResult ? 'result-active' : ''}`}>
                <ShootGameBackground themeConfig={themeConfig} />

                <GameXpPopup label={t('ext_983')} popup={xpPopup} />

                <ShootPlayStage
                    acquisitions={acquisitions}
                    characterAvatar={characterAvatar}
                    dailyMapNode={dailyMapNode}
                    diffConfig={diffConfig}
                    hideRetry={hideRetry}
                    hp={hp}
                    isClear={isClear}
                    isInputLocked={isInputLocked}
                    isPaused={isPaused}
                    isResult={isResult}
                    isWordTarget={isWordTarget}
                    killXp={killXp}
                    lasers={lasers}
                    missionXp={missionXp}
                    onExitCancel={onExitCancel}
                    onOptionClick={onOptionClick}
                    onPause={onPause}
                    onPauseExit={onPauseExit}
                    onResume={onResume}
                    onResultContinue={onResultContinue}
                    onResultRetry={onResultRetry}
                    onResultReturn={onResultReturn}
                    options={options}
                    reward={reward}
                    resultClearMsg={resultClearMsg}
                    score={score}
                    selectedCharacter={selectedCharacter}
                    shake={shake}
                    shootClearXp={shootClearXp}
                    targetId={targetId}
                    themeConfig={themeConfig}
                    turretAngle={turretAngle}
                    waveKills={waveKills}
                    words={words}
                />
            </div>

            {showExitModal && (
                <ExitConfirmModal
                    selectedCharacter={selectedCharacter}
                    dailyMapNode={dailyMapNode}
                    onCancel={() => onExitCancel(false)}
                    onConfirm={handleExitConfirm}
                />
            )}
        </>
    );
}