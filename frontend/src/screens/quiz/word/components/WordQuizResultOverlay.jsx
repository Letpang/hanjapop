import QuizResultOverlay from '../../../../components/common/QuizResultOverlay.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const WordQuizResultOverlay = ({
    phase,
    questions,
    correctCount,
    clearXp,
    dailyMapNode,
    getRewardPreview,
    hideRetry,
    missionXp,
    resultClearMsg,
    selectedCharacter,
    onBack,
    onRetry,
}) => {
    const { t } = useLang();

    if (phase !== 'result' || questions.length === 0) return null;

    const xpPerCorrect = 5;
    const correctXp = correctCount * xpPerCorrect;
    const isClear = Math.round((correctCount / questions.length) * 100) >= 70;
    const reward = getRewardPreview?.(correctXp + clearXp);

    return (
        <QuizResultOverlay
            isClear={isClear}
            completedLabel={t('ext_1733')}
            clearTitle={t(resultClearMsg)}
            scoreNode={isClear
                ? <>{t('ext_3184', { total: questions.length, correct: correctCount })}<span className="text-[1em] inline-block ml-1">🔥</span></>
                : t('ext_2364')}
            selectedCharacter={selectedCharacter}
            dailyMapNode={dailyMapNode}
            reward={reward}
            correctXp={correctXp}
            clearXp={clearXp}
            detailText={`${correctCount}${t('ext_231')} ${t('ext_275')} x ${xpPerCorrect}XP + ${t('ext_276')} ${clearXp}XP`}
            missionXp={missionXp}
            onRetry={onRetry}
            onBack={onBack}
            hideRetry={hideRetry}
        />
    );
};

export default WordQuizResultOverlay;
