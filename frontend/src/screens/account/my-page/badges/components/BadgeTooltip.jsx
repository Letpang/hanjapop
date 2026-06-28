const BadgeTooltip = ({ isVisible, label }) => (
  <div
    style={{
      position: 'absolute',
      bottom: '84%',
      left: '50%',
      transform: `translateX(-50%) scale(${isVisible ? 1 : 0.82})`,
      opacity: isVisible ? 1 : 0,
      pointerEvents: 'none',
      transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
      zIndex: 40,
    }}
    className="whitespace-nowrap"
  >
    <div className="px-3 py-1.5 rounded-xl text-base font-normal shadow-lg border bg-[#2D3142] border-[#2D3142] text-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
      {label}
    </div>
    <div className="w-1.5 h-1.5 rotate-45 mx-auto -mt-[3.5px] border-r border-b bg-[#2D3142] border-[#2D3142] dark:bg-slate-800 dark:border-slate-700" />
  </div>
);

export default BadgeTooltip;
