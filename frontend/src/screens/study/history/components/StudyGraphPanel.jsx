import { DoubleBars, SimpleBars, StackedBars } from './StudyGraphBars.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const GraphFrame = ({ children }) => (
  <div className="rounded-[1.5rem] bg-[#FBFCFD] px-3 py-4 dark:bg-slate-900">
    {children}
  </div>
);

const StudyGraphPanel = ({ items, maxQuestions, maxWords, maxWrong, maxXp, tab, totals }) => {
  const { t } = useLang();

  if (tab === 'xp') {
    return (
      <>
        <GraphFrame>
          <SimpleBars items={items} valueKey="xp" color="#FF9B73" max={maxXp} />
        </GraphFrame>
        <div className="mt-3 rounded-xl bg-[#FFF1EA] px-3 py-2 text-base font-normal text-[#E8664F] dark:bg-rose-950/40 dark:text-rose-300">
          {t('ext_2684', { xp: totals.xp })}
        </div>
      </>
    );
  }

  if (tab === 'words') {
    return (
      <>
        <GraphFrame>
          <DoubleBars items={items} max={maxWords} />
        </GraphFrame>
        <div className="mt-3 grid grid-cols-2 gap-2 text-center text-base font-normal">
          <span className="rounded-xl bg-[#E8FAF7] px-2 py-2 text-[#00A994] dark:bg-teal-950/40 dark:text-teal-300">{t('ext_479')} {totals.hanja}</span>
          <span className="rounded-xl bg-[#F0EFFF] px-2 py-2 text-[#6F63E8] dark:bg-indigo-950/40 dark:text-indigo-300">{t('ext_494')} {totals.words}</span>
        </div>
      </>
    );
  }

  if (tab === 'wrong') {
    return (
      <>
        <GraphFrame>
          <SimpleBars items={items} valueKey="wrong" color="#FF6B6B" max={maxWrong} />
        </GraphFrame>
        <div className="mt-3 rounded-xl bg-[#FFF1EE] px-3 py-2 text-base font-normal text-[#C94C3B] dark:bg-rose-950/40 dark:text-rose-300">
          {t('ext_2771', { wrong: totals.wrong })}
        </div>
      </>
    );
  }

  return (
    <>
      <GraphFrame>
        <StackedBars items={items} max={maxQuestions} />
      </GraphFrame>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-base font-normal">
        <span className="rounded-xl bg-[#E8FAF7] px-2 py-2 text-[#00A994] dark:bg-teal-950/40 dark:text-teal-300">{t('ext_1057')} {items.reduce((sum, item) => sum + item.flashcard, 0)}</span>
        <span className="rounded-xl bg-[#F0EFFF] px-2 py-2 text-[#6F63E8] dark:bg-indigo-950/40 dark:text-indigo-300">{t('ext_494')} {items.reduce((sum, item) => sum + item.wordQuiz, 0)}</span>
        <span className="rounded-xl bg-[#FFF1EA] px-2 py-2 text-[#E8664F] dark:bg-rose-950/40 dark:text-rose-300">{t('ext_3018')} {items.reduce((sum, item) => sum + item.sentenceQuiz, 0)}</span>
      </div>
    </>
  );
};

export default StudyGraphPanel;
