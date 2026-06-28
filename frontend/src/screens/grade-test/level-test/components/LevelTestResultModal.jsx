import ResultModalShell, {
  ResultModalActions,
  ResultModalHeading,
  ResultPrimaryButton,
} from '../../../../components/common/ResultModalShell.jsx';
import { getCharacterImage, getCharacterScale, getCharacterTranslateY } from '../../../../utils/rankUtils.js';
import { useLang } from '../../../../hooks/useLang.js';

const LevelTestResultModal = ({
  isOpen,
  passed,
  correctCount,
  questions,
  answers,
  passThreshold,
  selectedCharacter,
  onFinish,
}) => {
  const { t } = useLang();

  if (!isOpen) return null;

  return (
    <ResultModalShell
      tone={passed ? 'clear' : 'fail'}
      size="md"
      onBackdropClick={onFinish}
      labelledBy="level-test-result-title"
    >
      <div className="relative flex w-full flex-col items-center gap-4">
        <img
          src={getCharacterImage(selectedCharacter, passed ? 'success' : 'failure')}
          alt="result"
          className="mt-4 h-52 w-52 object-contain drop-shadow-xl"
          style={{
            transform: `translateY(${getCharacterTranslateY(selectedCharacter, true)}) scale(${getCharacterScale(selectedCharacter, passed ? 'success' : 'failure')})`,
          }}
        />

        <ResultModalHeading
          id="level-test-result-title"
          tone={passed ? 'clear' : 'fail'}
          kicker={passed ? t('ext_2285') : t('ext_2084')}
          title={t('ext_2784', { correctCount, questionCount: questions.length })}
          description={passed
            ? t('ext_2601')
            : t('ext_2903', { passThreshold })}
        >
          <div className="mt-2 flex items-center justify-center gap-2">
            <div className="flex items-center gap-2 rounded-full border-2 border-[#FFB433]/15 bg-[#FFB433]/10 px-6 py-2 shadow-sm">
              <span className="text-xl">⭐</span>
              <span className="text-body-lg font-normal text-[#FFB433]">{t('ext_2580', { xp: correctCount * 10 })}</span>
            </div>
          </div>
        </ResultModalHeading>

        <div className="flex flex-wrap justify-center gap-1.5 py-2">
          {questions.map(question => (
            <div
              key={question.id}
              className={`h-3 w-3 rounded-full ${answers[question.id] ? 'bg-[#FF9B73] shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-slate-200'}`}
            />
          ))}
        </div>

        <ResultModalActions>
          <ResultPrimaryButton onClick={onFinish} theme={passed ? 'indigo' : 'coral'}>
            {passed ? t('ext_1891') : t('ext_1068')}
          </ResultPrimaryButton>
        </ResultModalActions>
      </div>
    </ResultModalShell>
  );
};

export default LevelTestResultModal;
