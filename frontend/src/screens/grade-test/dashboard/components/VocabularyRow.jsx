const VocabularyRow = ({ item, index, isIdiom = false, theme }) => (
  <div
    key={item.id ?? `${item.word ?? item.hanja}-${index}`}
    className="rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-[var(--color-bg-surface)] px-4 py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.035)]"
  >
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span className={`${isIdiom ? 'hanja-char text-2xl' : 'text-lg'} font-semibold text-slate-800 dark:text-slate-100`}>
          {item.word ?? item.hanja}
        </span>
        <span className="text-sm text-slate-500 dark:text-slate-400">{item.reading}</span>
      </div>
      {!isIdiom && item.hanjaChar && (
        <span
          className="rounded-lg px-2 py-0.5 text-sm shrink-0"
          style={{ backgroundColor: theme.bgLight, color: theme.accentDeep }}
        >
          {item.hanjaChar}
        </span>
      )}
    </div>
    <p className="mt-1.5 text-base leading-relaxed text-slate-600 dark:text-slate-300 break-keep">
      {item.meaning}
    </p>
  </div>
);

export default VocabularyRow;
