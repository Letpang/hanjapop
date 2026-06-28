import CtaButton from '../../../../components/common/CtaButton.jsx';
import RewardBreakdown from '../../../../components/common/RewardBreakdown.jsx';
import { getCharacterImage, getCharacterScale, getCharacterTranslateY } from '../../../../utils/rankUtils.js';
import { useLang } from '../../../../hooks/useLang.js';

const ShootResultOverlay = ({
    isClear,
    dailyMapNode,
    resultClearMsg,
    selectedCharacter,
    reward,
    killXp,
    shootClearXp,
    score,
    missionXp,
    hideRetry,
    onRetry,
    onContinue,
    onReturn,
}) => {
    const { t } = useLang();

    return (
        <div className={`daily-session-result-backdrop${isClear ? '' : ' daily-session-result-backdrop--fail'}`}>
            <div className={`activity-result-card ${(!dailyMapNode || !isClear) ? 'shoot-result-card' : ''}`}>
                <div className={`${(dailyMapNode && isClear) ? 'pt-5 pb-6 gap-4' : 'shoot-result-card-body'} px-6 flex flex-col items-center w-full relative`}>
                    {(!dailyMapNode || !isClear) && (
                        <div className="activity-result-glow" />
                    )}

                    {(!dailyMapNode || !isClear) && (
                        <img
                            src={isClear ? getCharacterImage(selectedCharacter, 'success') : getCharacterImage(selectedCharacter, 'failure')}
                            alt={isClear ? 'clear' : 'over'}
                            className="activity-result-char img-shadow-lg"
                            style={{ transform: `translateY(${getCharacterTranslateY(selectedCharacter, true)}) scale(${getCharacterScale(selectedCharacter, isClear ? 'success' : 'failure')})` }}
                        />
                    )}

                    <div className={`${(!dailyMapNode || !isClear) ? 'shoot-result-content-stack' : ''} text-center flex flex-col gap-1 w-full relative z-10`}>
                        <span className="result-subtitle">
                            {isClear ? t('ext_1768') : t('ext_1793')}
                        </span>
                        <h1 className={`text-3xl leading-tight mt-1 result-title ${isClear ? 'result-title--clear' : 'result-title--fail'}`}>
                            {isClear ? t(resultClearMsg) : <> {t('ext_1475')}<br />{t('ext_1691')}</>}
                        </h1>
                        {!isClear && (
                            <div className="flex flex-col items-center gap-1 mt-3">
                                <p className="result-fail-desc">
                                    {t('ext_2932', { score })}<span className="text-[1em] inline-block ml-1">🔥</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {(dailyMapNode && isClear) && (
                        <div className="w-full">
                            {dailyMapNode}
                        </div>
                    )}

                    <div className={(!dailyMapNode || !isClear) ? 'shoot-result-lower-stack' : 'w-full'}>
                        <RewardBreakdown
                            reward={reward}
                            correctXp={killXp}
                            clearXp={shootClearXp}
                            correctLabel={t('ext_1582')}
                            detailText={`${t('ext_3203', { n: score })}${shootClearXp > 0 ? ` + ${t('ext_276')} ${shootClearXp}XP` : ''}`}
                            missionXp={missionXp}
                        />
                    </div>

                    <div className={`result-btn-area ${(!dailyMapNode || !isClear) ? 'shoot-result-lower-stack' : ''}`}>
                        {!hideRetry && (
                            <CtaButton theme="indigo" onClick={onRetry}>
                                <span className="quiz-cta-text">{t('ext_1501')}</span>
                            </CtaButton>
                        )}
                        {(dailyMapNode && isClear) ? (
                            <CtaButton theme="coral" onClick={onContinue}>
                                <span className="quiz-cta-text">{t('ext_1747')}</span>
                                <span className="quiz-cta-text ml-2">›</span>
                            </CtaButton>
                        ) : (
                            <button onClick={onReturn} className="back-quiz-button">
                                {t('ext_1068')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShootResultOverlay;
