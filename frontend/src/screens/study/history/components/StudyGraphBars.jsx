const DayLabel = ({ children }) => (
  <span className="block h-4 text-base font-normal leading-4 text-[#AEB7C5]">{children}</span>
);

const StackedBar = ({ item, max }) => {
  const total = item.flashcard + item.wordQuiz + item.sentenceQuiz;
  const height = total ? Math.max(12, Math.round((total / max) * 96)) : 6;
  const flash = total ? (item.flashcard / total) * 100 : 0;
  const word = total ? (item.wordQuiz / total) * 100 : 0;
  const sentence = Math.max(0, 100 - flash - word);

  return (
    <div className="flex h-32 min-w-0 flex-col items-center justify-end gap-1">
      <div className="flex w-[68%] max-w-[18px] flex-col-reverse overflow-hidden rounded-t-xl rounded-b-md bg-[#EDF2F7] dark:bg-slate-700" style={{ height }}>
        {item.flashcard > 0 && <span className="w-full bg-[#2ED6C5]" style={{ height: `${flash}%` }} />}
        {item.wordQuiz > 0 && <span className="w-full bg-[#7C83FF]" style={{ height: `${word}%` }} />}
        {item.sentenceQuiz > 0 && <span className="w-full bg-[#FF9B73]" style={{ height: `${sentence}%` }} />}
      </div>
      <DayLabel>{item.shortLabel}</DayLabel>
    </div>
  );
};

export const StackedBars = ({ items, max }) => (
  <div className="grid h-36 items-end gap-1" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
    {items.map((item) => <StackedBar key={item.date} item={item} max={max} />)}
  </div>
);

export const SimpleBars = ({ items, valueKey, color, max }) => (
  <div className="grid h-36 items-end gap-1" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
    {items.map((item) => {
      const value = item[valueKey] || 0;
      const height = value ? Math.max(10, Math.round((value / max) * 104)) : 6;
      return (
        <div key={item.date} className="flex min-w-0 flex-col items-center justify-end gap-1">
          <div className="w-[68%] max-w-[18px] rounded-t-xl rounded-b-md" style={{ height, background: value ? color : '#EDF2F7' }} />
          <DayLabel>{item.shortLabel}</DayLabel>
        </div>
      );
    })}
  </div>
);

export const DoubleBars = ({ items, max }) => (
  <div className="grid h-36 items-end gap-1" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
    {items.map((item) => {
      const hanjaHeight = item.hanja ? Math.max(10, Math.round((item.hanja / max) * 104)) : 6;
      const wordHeight = item.words ? Math.max(10, Math.round((item.words / max) * 104)) : 6;
      return (
        <div key={item.date} className="flex min-w-0 flex-col items-center justify-end gap-1">
          <div className="flex items-end gap-0.5">
            <div className="w-1.5 rounded-t-lg rounded-b-sm bg-[#2ED6C5]" style={{ height: hanjaHeight, opacity: item.hanja ? 1 : 0.16 }} />
            <div className="w-1.5 rounded-t-lg rounded-b-sm bg-[#7C83FF]" style={{ height: wordHeight, opacity: item.words ? 1 : 0.16 }} />
          </div>
          <DayLabel>{item.shortLabel}</DayLabel>
        </div>
      );
    })}
  </div>
);
