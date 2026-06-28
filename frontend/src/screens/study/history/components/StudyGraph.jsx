import { useMemo, useState } from 'react';
import { getGraphStats, getRecentDates, graphTabs } from '../historyUtils.js';
import StudyGraphPanel from './StudyGraphPanel.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const StudyGraph = ({ days }) => {
  const { t } = useLang();
  const [tab, setTab] = useState('questions');
  const items = useMemo(() => getRecentDates(14).map((date) => {
    const stats = getGraphStats(days[date] || {});
    const day = Number(date.slice(-2));
    return {
      date,
      shortLabel: day % 2 === 0 ? `${day}` : '',
      totalQuestions: stats.flashcard + stats.wordQuiz + stats.sentenceQuiz,
      ...stats,
    };
  }), [days]);

  const totals = items.reduce((acc, item) => ({
    questions: acc.questions + item.totalQuestions,
    xp: acc.xp + item.xp,
    hanja: acc.hanja + item.hanja,
    words: acc.words + item.words,
    wrong: acc.wrong + item.wrong,
  }), { questions: 0, xp: 0, hanja: 0, words: 0, wrong: 0 });

  const maxQuestions = Math.max(1, ...items.map((item) => item.totalQuestions));
  const maxXp = Math.max(1, ...items.map((item) => item.xp));
  const maxWords = Math.max(1, ...items.map((item) => Math.max(item.hanja, item.words)));
  const maxWrong = Math.max(1, ...items.map((item) => item.wrong));

  return (
    <section className="premium-panel p-5 ">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-normal tracking-wider text-[#8D9CAE]">{t('ext_1648')}</p>
          <h3 className="text-lg font-medium text-[#334155] dark:text-white">{t('ext_1649')}</h3>
        </div>
        <div className="rounded-2xl bg-[#F8FAF9] px-3 py-2 text-right dark:bg-slate-900">
          <p className="text-base font-normal text-[#8D9CAE]">{t('ext_1686')}</p>
          <p className="text-base font-normal text-[#00A994]">{t('ext_2365', { count: totals.questions })}</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-1.5 rounded-2xl bg-[#F4F7F8] p-1.5 dark:bg-slate-900">
        {graphTabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`min-h-[2.25rem] py-1.5 px-1 rounded-xl text-sm font-normal leading-tight transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00C7AE]/30 ${tab === id ? 'bg-white text-[#00A994] shadow-sm dark:bg-slate-800' : 'text-[#8D9CAE]'}`}
          >
            {t(label)}
          </button>
        ))}
      </div>

      <StudyGraphPanel
        items={items}
        maxQuestions={maxQuestions}
        maxWords={maxWords}
        maxWrong={maxWrong}
        maxXp={maxXp}
        tab={tab}
        totals={totals}
      />
    </section>
  );
};

export default StudyGraph;
