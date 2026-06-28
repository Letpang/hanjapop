import { useLang } from '../../../../hooks/useLang.js';

const GradeReviewPanel = ({ selectedGrade, onSelectGrade, style }) => {
  const { t } = useLang();

  return (
    <div className="w-full max-w-md relative" style={style}>
      <div className="flex flex-col gap-3">
        <div className="w-full rounded-[1.5rem] bg-indigo-50/80 p-5 border border-indigo-100 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center text-center gap-1.5">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
              </svg>
            </div>
            <h4 className="font-normal text-indigo-900 text-[17px] tracking-normal">{t('ext_2414', { selectedGrade })}</h4>
            <p className="text-base font-normal text-indigo-700/80 leading-snug break-keep">
              {t('ext_281')} {selectedGrade} {t('ext_479')} {t('ext_276')} {t('ext_478')} {t('ext_2017')}
            </p>
          </div>
        </div>
        <button
          onClick={() => onSelectGrade(null)}
          className="w-full py-4 rounded-[1.5rem] bg-white border-2 border-slate-200 text-slate-500 font-normal text-base active:scale-95 transition-all shadow-sm flex justify-center items-center gap-2"
        >
          {t('ext_1068')}
        </button>
      </div>
    </div>
  );
};

export default GradeReviewPanel;