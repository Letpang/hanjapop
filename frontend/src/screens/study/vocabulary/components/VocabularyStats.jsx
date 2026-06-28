import { useLang } from '../../../../hooks/useLang.js';

const VocabularyStats = ({ totalCount, wrongCount, correctCount }) => {
  const { t } = useLang();

  return (
    <section className="premium-panel p-4 ">
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center rounded-2xl bg-[#E8FAF7] px-3 py-3 text-center dark:bg-teal-950/35">
          <div className="flex items-center justify-center min-h-[3rem]">
            <p className="vocabulary-stat-label text-[#00A994]">{t('ext_281')}</p>
          </div>
          <p className="text-3xl font-bold text-[#334155] dark:text-slate-100">{totalCount}</p>
        </div>
        <div className="flex flex-col items-center rounded-2xl bg-[#FFF1EE] px-3 py-3 text-center dark:bg-rose-950/30">
          <div className="flex items-center justify-center min-h-[3rem]">
            <p className="vocabulary-stat-label text-[#E8664F]">{t('ext_277')}</p>
          </div>
          <p className="text-3xl font-bold text-[#334155] dark:text-slate-100">{wrongCount}</p>
        </div>
        <div className="flex flex-col items-center rounded-2xl bg-[#F5F3FF] px-3 py-3 text-center dark:bg-indigo-950/35">
          <div className="flex items-center justify-center min-h-[3rem]">
            <p className="vocabulary-stat-label text-[#7C83FF]">{t('ext_275')}</p>
          </div>
          <p className="text-3xl font-bold text-[#334155] dark:text-slate-100">{correctCount}</p>
        </div>
      </div>
    </section>
  );
};

export default VocabularyStats;
