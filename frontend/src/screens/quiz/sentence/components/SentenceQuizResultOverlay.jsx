import QuizResultOverlay from '../../../../components/common/QuizResultOverlay.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const SentenceQuizResultOverlay = ({
    started,
    gameState,
    completing,
    resultStats,
    score,
    totalAnswered,
    resultClearMsg,
    selectedCharacter,
    dailyMapNode,
    reward,
    clearXp,
    missionXp,
    hideRetry,
    onRetry,
    onBack,
    onNextStage,
}) => {
    const { t } = useLang();

    if (!started || (gameState !== 'result' && !completing)) return null;

    const resultCorrect = resultStats?.correct ?? score;
    const resultTotal = Math.max(resultStats?.total ?? totalAnswered, 1);
    const isClear = resultCorrect >= resultTotal * 0.7;
    const xpPerCorrect = 10;
    const correctXp = resultCorrect * xpPerCorrect;

    return (
        <QuizResultOverlay
            isClear={isClear}
            completedLabel={t('ext_1732')}
            clearTitle={t(resultClearMsg)}
            scoreNode={isClear
                ? <>{t('ext_3184', { total: resultTotal, correct: resultCorrect })}<span className="text-[1em] inline-block ml-1">🔥</span></>
                : t('ext_2364')}
            selectedCharacter={selectedCharacter}
            dailyMapNode={dailyMapNode}
            reward={reward}
            correctXp={correctXp}
            clearXp={clearXp}
            detailText={`${resultCorrect}${t('ext_231')} ${t('ext_275')} x ${xpPerCorrect}XP + ${t('ext_276')} ${clearXp}XP`}
            missionXp={missionXp}
            onRetry={onRetry}
            onBack={onBack}
            onNextStage={onNextStage}
            hideRetry={hideRetry}
        />
    );
};

export default SentenceQuizResultOverlay;
