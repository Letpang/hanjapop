import { useLang } from '../../../../hooks/useLang.js';

const WritingControls = ({
  isComplete,
  isAnimCJK,
  isAnimating,
  nextLabel,
  onGuide,
  onManualComplete,
  onNextHanja,
  onRetry,
}) => {
  const { t } = useLang();

  if (isComplete) {
    return (
      <div className="w-full flex flex-col gap-2 sm:gap-3 animate-in slide-in-from-bottom-4 duration-500">
        <button onClick={onNextHanja}
          className="hp-cta-button hp-cta-button--indigo !py-3.5 sm:!py-4">
          {nextLabel}
        </button>
        <button onClick={onRetry}
          className="w-full py-3 text-[#8C97A8] font-normal text-h3-res">
          {t('ext_1544')}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-2 sm:gap-3">
      <button onClick={onManualComplete}
        className="hp-cta-button hp-cta-button--indigo !py-3.5 sm:!py-4">
        {nextLabel}
      </button>
      <button
        onClick={onGuide}
        disabled={isAnimating}
        className="w-full back-quiz-button disabled:opacity-50 !py-2.5 sm:!py-3"
      >
        {isAnimCJK ? t('ext_1544') : isAnimating ? t('ext_1787') : t('ext_1737')}
      </button>
    </div>
  );
};

export default WritingControls;