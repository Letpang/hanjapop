import QuizResultOverlay from '../../../../components/common/QuizResultOverlay.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const IdiomQuizResult = ({
  done,
  score,
  total,
  resultClearMsg,
  selectedCharacter,
  getRewardPreview,
  missionXp,
  onRetry,
  onBack,
}) => {
  const { t } = useLang();

  if (!done) return null;

  const pct = Math.round((score / total) * 100);
  const isClear = pct >= 70;
  const correctXp = score * 5;
  const clearXp = 25;
  const reward = getRewardPreview?.(correctXp + clearXp);

  return (
    <QuizResultOverlay
      isClear={isClear}
      completedLabel={t('ext_1684')}
      clearTitle={pct === 100 ? t('ext_1783') : t(resultClearMsg)}
      scoreNode={t('ext_2286', { score, TOTAL: total })}
      selectedCharacter={selectedCharacter}
      reward={reward}
      correctXp={correctXp}
      clearXp={clearXp}
      detailText={`${score}${t('ext_231')} ${t('ext_275')} x 5XP + ${t('ext_276')} ${clearXp}XP`}
      missionXp={missionXp}
      onRetry={onRetry}
      onBack={onBack}
      backLabel={t('ext_1731')}
    />
  );
};

export default IdiomQuizResult;
