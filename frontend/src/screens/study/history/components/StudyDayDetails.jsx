import { activityLabels } from '../historyUtils.js';
import DetailSection from './DetailSection.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const WordHistoryList = ({ items, tone = 'teal' }) => {
  const isCoral = tone === 'coral';
  const accent = isCoral ? 'bg-[#FFE2DC] text-[#E8664F]' : 'bg-[#E8FAF7] text-[#00A994]';
  const text = isCoral ? 'text-[#C94C3B]' : 'text-[#334155] dark:text-slate-200';

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((word) => (
        <div
          key={word.id}
          className="flex items-center justify-between gap-3 rounded-2xl border border-[#E9EDF2] bg-[#FBFCFD] px-3.5 py-3 shadow-[0_4px_14px_rgba(15,23,42,0.035)] dark:border-slate-700 dark:bg-slate-900/70"
        >
          <div className="min-w-0">
            <span className={`block truncate text-xl font-normal leading-tight ${text}`}>{word.word}</span>
            <span className="mt-0.5 block truncate text-base font-normal leading-tight text-[#8D9CAE]">{word.reading}</span>
          </div>
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${accent}`} />
        </div>
      ))}
    </div>
  );
};

const StudyDayDetails = ({ hasSelectedData, selectedDay, selectedSummary }) => {
  const { t } = useLang();
  const activityTotal = selectedSummary.activityCounts?.reduce((sum, activity) => sum + activity.count, 0) || 0;

  return (
    <section className="rounded-[2rem] border p-5 shadow-sm bg-[var(--color-bg-surface)] border-[var(--color-border-subtle)] dark:bg-slate-800 dark:border-slate-700">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-base font-normal tracking-wider text-[#8D9CAE]">{selectedDay.replace(/-/g, '.')}</p>
          <h3 className="text-lg font-medium text-[#334155] dark:text-white">{t('ext_1606')}</h3>
        </div>
        <span className="rounded-full bg-[#F4F6F8] dark:bg-slate-700 px-3 py-1 text-xs font-normal text-[#5D677A] dark:text-slate-300">
          {t('ext_2887', { count: activityTotal })}
        </span>
      </div>

      {!hasSelectedData ? (
        <div className="rounded-[1.5rem] border border-dashed border-slate-200 dark:border-slate-600 py-10 text-center text-sm font-normal text-[#AEB7C5] dark:text-slate-400">
          {t('ext_2515')}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {activityTotal > 0 && (
            <DetailSection title={t('ext_1607')} count={activityTotal} tone="teal">
              <div className="grid grid-cols-2 gap-2">
                {selectedSummary.activityCounts.map(({ type, count }) => (
                  <div key={type} className="flex items-center justify-between gap-2 rounded-2xl bg-[#F8FAF9] dark:bg-slate-900 px-3 py-2 text-sm font-normal text-[#45546A] dark:text-slate-300">
                    <span className="leading-tight text-xs">{activityLabels[type] ? t(activityLabels[type]) : type}</span>
                    <span className="shrink-0 rounded-full bg-[#E8FAF7] px-2 py-0.5 text-xs text-[#00A994] dark:bg-teal-950/40 dark:text-teal-300">
                      {count}{t('ext_231')}
                    </span>
                  </div>
                ))}
              </div>
            </DetailSection>
          )}

          {selectedSummary.hanjas.length > 0 && (
            <DetailSection title={t('ext_1608')} count={selectedSummary.hanjas.length} tone="slate">
              <div className="grid grid-cols-3 gap-2">
                {selectedSummary.hanjas.map(h => (
                  <div key={h.id} className="rounded-[1.5rem] border border-slate-100 dark:border-slate-700 bg-[var(--color-bg-surface)] px-2 py-3 shadow-sm flex flex-col items-center text-center gap-1">
                    <span className="text-3xl font-normal text-[#334155] dark:text-slate-100">{h.hanja}</span>
                    <p className="text-base font-normal leading-tight text-center px-1">
                      <span className="text-[#94A3B8]">{h.meaning}</span>
                      <span className="text-[#334155] dark:text-slate-200"> {h.sound}</span>
                    </p>
                  </div>
                ))}
              </div>
            </DetailSection>
          )}

          {selectedSummary.correctWords.length > 0 && (
            <DetailSection title={t('ext_1539')} count={selectedSummary.correctWords.length} tone="teal">
              <WordHistoryList items={selectedSummary.correctWords} tone="teal" />
            </DetailSection>
          )}

          {selectedSummary.wrongWords.length > 0 && (
            <DetailSection title={t('ext_1540')} count={selectedSummary.wrongWords.length} tone="coral">
              <WordHistoryList items={selectedSummary.wrongWords} tone="coral" />
            </DetailSection>
          )}
        </div>
      )}
    </section>
  );
};

export default StudyDayDetails;
