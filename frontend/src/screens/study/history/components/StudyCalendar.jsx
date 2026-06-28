import { getEntrySummary, todayStr } from '../historyUtils.js';
import { useLang } from '../../../../hooks/useLang.js';

const StudyCalendar = ({
  cells,
  days,
  missionHistory,
  month,
  selectedDay,
  setSelectedDay,
  setViewDate,
  streakCount,
  year,
}) => {
  const { t, lang } = useLang();

  const getDayStr = (day) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getDayState = (day) => {
    const ds = getDayStr(day);
    const entry = days[ds] || {};
    const missions = missionHistory[ds] || [];
    const summary = getEntrySummary(entry, missions);
    const isToday = ds === todayStr;
    const isPast = new Date(year, month, day) < new Date(new Date().setHours(0, 0, 0, 0));

    if (isToday) return 'today';
    if (summary.totalCount > 0 || summary.activities.length > 0) return 'done';
    if (isPast) return 'miss';
    return 'future';
  };

  return (
    <section className="rounded-[2rem] border p-5 shadow-sm bg-[var(--color-bg-surface)] border-[var(--color-border-subtle)] dark:bg-slate-800 dark:border-slate-700">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="h-10 w-10 rounded-2xl border font-normal bg-[#F4F6F8] border-slate-100 dark:bg-slate-700 dark:border-slate-600"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="text-base font-normal tracking-[0.2em] text-[#8D9CAE]">{year}</p>
          <p className="text-xl font-normal text-[#00A994]">
            {(() => {
              if (['ko', 'ja', 'zh-CN', 'zh-TW'].includes(lang)) {
                return t('ext_1958', { month: month + 1 });
              }
              const name = new Date(year, month).toLocaleString(lang || 'en', { month: 'long' });
              return name.charAt(0).toUpperCase() + name.slice(1);
            })()}
          </p>
        </div>
        <button
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="h-10 w-10 rounded-2xl border font-normal bg-[#F4F6F8] border-slate-100 dark:bg-slate-700 dark:border-slate-600"
        >
          ›
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 text-center text-xs font-normal text-[#8D9CAE]">
        {['ext_1', 'ext_26', 'ext_39', 'ext_41', 'ext_43', 'ext_44', 'ext_46'].map(key => <span key={key}>{t(key)}</span>)}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;
          const ds = getDayStr(day);
          const state = getDayState(day);
          const isSelected = selectedDay === ds;
          const base = 'aspect-square rounded-2xl text-base font-medium flex items-center justify-center transition-all active:scale-95';
          const classes = {
            today: 'bg-[#00C7AE] text-white shadow-md shadow-teal-500/25',
            done: 'bg-[var(--color-bg-surface)] text-[#334155] dark:text-slate-200 border-2 border-[#00C7AE]/45',
            miss: 'bg-[#F0F2F5] dark:bg-slate-800/70 text-[#B8C0CC] dark:text-slate-500',
            future: 'bg-transparent text-[#C5CAD4]',
          };

          return (
            <button
              key={ds}
              onClick={() => setSelectedDay(ds)}
              className={`${base} ${classes[state]} ${isSelected ? 'ring-4 ring-[#00C7AE]/20 scale-105' : ''}`}
            >
              <span className="leading-none">{day}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-2xl bg-[#F8FAF9] dark:bg-slate-900 py-2 text-base font-normal text-[#5D677A]">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border-2 border-[#00C7AE]" />{t('ext_1647')}</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#00C7AE]" />{t('ext_1471')}</span>
        {streakCount > 0 ? <span className="text-[#FF8D7E]">{t('ext_2254', { streakCount })}</span> : null}
      </div>
    </section>
  );
};

export default StudyCalendar;
