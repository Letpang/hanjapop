import { useLang } from '../../../../hooks/useLang.js';

const JourneyResultButton = ({ onShowResults }) => {
  const { t } = useLang();

  return (
    <div className="flex flex-col items-center pb-4 pt-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <button
        onClick={onShowResults}
        className="mt-2 w-[85%] max-w-[280px] rounded-full bg-[#FF9B73] py-3.5 text-lg font-normal text-white shadow-xl shadow-[#FF9B73]/20 transition-all active:scale-95"
      >
        {t('ext_1639')}
      </button>
    </div>
  );
};

export default JourneyResultButton;