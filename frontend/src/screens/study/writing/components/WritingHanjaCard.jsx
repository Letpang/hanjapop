const WritingHanjaCard = ({ item, isCompleted, onClick }) => (
  <button
    onClick={onClick}
    className={`hanja-grid-card ${isCompleted ? 'hanja-grid-card--completed' : ''}`}
  >
    {isCompleted && <div className="hanja-grid-card__check">✓</div>}
    <div className="hanja-grid-card__char leading-none text-[#2C2C3A] dark:text-slate-100 flex items-center justify-center mb-2">
      {item.hanja}
    </div>
    <div className="w-full pt-1 flex items-center justify-center">
      <p className="text-center text-[color:var(--color-text-muted)] dark:text-slate-300 text-[1.7rem] tracking-normal leading-snug break-keep">
        <span className="font-normal">{item.meaning}</span>
        <span className={`font-medium ml-1.5 ${isCompleted ? 'text-[#2ED6C5]' : 'text-[#7C83FF]'}`}>{item.sound}</span>
      </p>
    </div>
  </button>
);

export default WritingHanjaCard;
