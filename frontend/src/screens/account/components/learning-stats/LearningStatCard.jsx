const LearningStatCard = ({ isDarkMode, item }) => {
  const display = item.value;
  const isEmpty = display === '-';

  return (
    <div
      className={`rounded-[1.5rem] border px-2 py-3 flex items-center gap-2 active:scale-[0.98] transition-all duration-300 ${
        isDarkMode
          ? `${item.bgDark} ${item.borderDark}`
          : `${item.bg} ${item.border}`
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 shadow-sm ${
        `bg-[var(--color-bg-surface)]/80 dark:border-slate-700/60 ${item.iconBorder}`
      }`}>
        <img
          src={item.imgSrc}
          alt={item.label}
          className="w-6 h-6 object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.05)] transform hover:scale-110 transition-transform duration-300"
        />
      </div>

      <div className="flex-1 min-w-0">
        <span className="learning-stat-label dark:text-slate-400">
          {item.label}
        </span>
        <div className="flex flex-col">
          <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
            <span className="text-xl font-normal tracking-normal leading-none bg-gradient-to-br from-[#2D3142] to-[#4F5D75] bg-clip-text text-transparent dark:text-white font-display">
              {display}
            </span>
            {item.unit && !isEmpty && (
              <span className="text-sm font-normal leading-none shrink-0 text-[#8D9CAE] dark:text-slate-400">
                {item.unit}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningStatCard;
