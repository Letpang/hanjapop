import RewardBreakdown from '../../../../components/common/RewardBreakdown.jsx';
import MatchResultActions from './MatchResultActions.jsx';
import MatchResultCharacter from './MatchResultCharacter.jsx';
import { useLang } from '../../../../hooks/useLang.js';

export default function MatchResultOverlay({
    clearCount,
    clearXp,
    contentPool,
    dailyMapNode,
    gameState,
    hideRetry,
    matchXp,
    matches,
    missionDoneAtStart,
    onBack,
    onContinue,
    onDeliverStageClear,
    onGameFinish,
    onRetry,
    resultClearMsg,
    reward,
    selectedCharacter,
    xpPerMatch,
}) {
    const { t } = useLang();
    const isClear = gameState === 'clear';

    return (
        <div className={`daily-session-result-backdrop${!isClear ? ' daily-session-result-backdrop--fail' : ''}`}>
            <div className={`activity-result-card ${!dailyMapNode ? 'result-balanced-card' : ''}`}>
                {dailyMapNode}
                <div className={`${dailyMapNode ? 'pt-5 pb-6 gap-4 mt-4' : 'result-balanced-body'} px-6 flex flex-col items-center w-full relative`}>
                    {!dailyMapNode && <div className="activity-result-glow" />}

                    {!dailyMapNode && <MatchResultCharacter isClear={isClear} selectedCharacter={selectedCharacter} />}

                    <div className={`result-text-area mt-2 ${!dailyMapNode ? 'result-balanced-content-stack' : ''}`}>
                        {!isClear && <span className="result-subtitle">{t('ext_1793')}</span>}
                        <h1 className={`text-h2-res leading-snug result-title ${isClear ? 'result-title--clear' : 'result-title--fail'}`}>
                            {isClear ? t(resultClearMsg) : t('ext_1767')}
                        </h1>
                        {!isClear && (
                            <p className="result-fail-desc">
                                {t('ext_2973')}
                            </p>
                        )}
                    </div>

                    <div className={!dailyMapNode ? 'result-balanced-lower-stack' : 'w-full'}>
                        <RewardBreakdown
                            reward={reward}
                            correctXp={matchXp}
                            clearXp={clearXp}
                            correctLabel={t('ext_1498')}
                            detailText={`${t('ext_3198', { n: matches })} x ${xpPerMatch}XP${clearXp > 0 ? ` + ${t('ext_276')} ${clearXp}XP` : ''}`}
                            missionXp={(isClear && clearCount === 1 && !missionDoneAtStart) ? 20 : 0}
                        />
                    </div>

                    <MatchResultActions
                        contentPool={contentPool}
                        dailyMapNode={dailyMapNode}
                        hideRetry={hideRetry}
                        isClear={isClear}
                        onBack={onBack}
                        onContinue={onContinue}
                        onDeliverStageClear={onDeliverStageClear}
                        onGameFinish={onGameFinish}
                        onRetry={onRetry}
                    />
                </div>
            </div>
        </div>
    );
}