const GRADE_BAR_COLOR = {
  '8급': '#A8E6CF',
  '7급Ⅱ': '#FFADAD',
  '7급': '#FFD6A5',
  '6급Ⅱ': '#BDB2FF',
  '6급': '#A5F3FC',
  NON: '#C7D2FE',
};

const HanjaCard = ({ item, isLocked, isCompleted, onClick }) => {
  const barColor = GRADE_BAR_COLOR[item.grade] || '#E2E8F0';
  const readingLabel = [item.meaning, item.sound].filter(Boolean).join(' ');

  if (isLocked) {
    return (
      <div className="hanja-grid-card hanja-grid-card--locked">
        <span className="text-h1-res opacity-20 mb-3">🔒</span>
        <span className="hanja-char text-[#5D544F] font-normal text-h3-res tracking-normaler uppercase">{item.hanja}</span>
        <div className="absolute bottom-0 left-0 right-0 h-1.5 opacity-30" style={{ backgroundColor: barColor }} />
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`hanja-grid-card group ${isCompleted ? 'hanja-grid-card--completed' : ''}`}
    >
      {isCompleted && <div className="hanja-grid-card__check">✓</div>}
      <div className="w-24 h-24 mb-3 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-500">
        <div
          className="absolute inset-0 rounded-[2.5rem] opacity-5 group-hover:opacity-10 transition-opacity"
          style={{ backgroundColor: barColor }}
        />
        <img
          src={`/assets/images/hanja_all/${item.id}_${encodeURIComponent(item.hanja)}.webp`}
          onError={(e) => {
            if (e.target.src.endsWith('.webp')) e.target.src = `/assets/images/hanja_all/${item.id}_${encodeURIComponent(item.hanja)}.svg`;
            else e.target.src = '/assets/images/hanja_placeholder.webp';
          }}
          className="w-[95%] h-[95%] object-contain relative z-20 drop-shadow-sm"
          alt={item.hanja}
        />
      </div>
      <div className="flex flex-col items-center relative z-10">
        <span className="hanja-char text-h2-res font-normal text-[#5D544F] tracking-normaler uppercase">{item.hanja}</span>
        <span className="mt-1 text-center text-[1.45rem] font-normal leading-tight text-[color:var(--color-text-muted)] break-keep dark:text-slate-300">
          {readingLabel}
        </span>
      </div>
    </button>
  );
};

export default HanjaCard;
