import { useLang } from '../../../../hooks/useLang.js';

export default function MatchGameHeader({
    counter,
    onBack,
    onPause,
    showPause = false,
    backLabel = '←',
}) {
    const { t } = useLang();

    return (
        <div className="quiz-header-wrap quiz-header-wrap--sm">
            <div className="quiz-header-card quiz-header-card--wide">
                <button onClick={onBack} className="hp-nav-button">
                    <span>{backLabel}</span>
                </button>
                <div className="quiz-header-title-area">
                    <h2 className="quiz-screen-title">{t('ext_1574')}</h2>
                    <p className="screen-subtitle">{t('ext_2454')}</p>
                </div>
                {counter || showPause ? (
                    <div className="quiz-header-right flex items-center gap-2">
                        {counter && <span className="quiz-counter-text">{counter}</span>}
                        {showPause && (
                            <button
                                onClick={onPause}
                                className="hp-nav-button hp-nav-button--compact"
                            >
                                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-slate-400">
                                    <rect x="5" y="4" width="4" height="16" rx="1.5" />
                                    <rect x="15" y="4" width="4" height="16" rx="1.5" />
                                </svg>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="w-11" />
                )}
            </div>
        </div>
    );
}