import CtaButton from '../../../../components/common/CtaButton.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const MatchResultActions = ({
    contentPool,
    dailyMapNode,
    hideRetry,
    isClear,
    onBack,
    onContinue,
    onDeliverStageClear,
    onGameFinish,
    onRetry,
}) => {
    const { t } = useLang();

    return (
        <div className={`result-btn-area ${!dailyMapNode ? 'result-balanced-lower-stack' : ''}`}>
            {(!hideRetry || (isClear && contentPool == null)) && (
                <CtaButton
                    theme={isClear && contentPool == null ? 'coral' : 'indigo'}
                    onClick={isClear && contentPool == null ? onContinue : onRetry}
                >
                    <span className="quiz-cta-text">
                        {isClear && contentPool == null ? t('ext_1580') : t('ext_1375')}
                    </span>
                    {isClear && contentPool == null && (
                        <span className="quiz-cta-text ml-2">›</span>
                    )}
                </CtaButton>
            )}

            {(dailyMapNode && isClear) ? (
                <CtaButton theme="coral" onClick={() => { onDeliverStageClear(); (onGameFinish || onBack)(); }}>
                    <span className="quiz-cta-text">{t('ext_279')}</span>
                    <span className="quiz-cta-text ml-2">›</span>
                </CtaButton>
            ) : (
                <button
                    onClick={() => {
                        if (isClear) onDeliverStageClear();
                        onBack();
                    }}
                    className="back-quiz-button"
                >
                    {t('ext_1068')}
                </button>
            )}
        </div>
    );
};

export default MatchResultActions;