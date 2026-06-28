const ReferralMilestoneGrid = ({ milestones }) => (
  <div className="mt-4 grid grid-cols-3 gap-2">
    {milestones.map(item => (
      <div
        key={item.count}
        className={`rounded-[1.25rem] border px-2.5 py-3 text-center ${
          item.done
            ? 'bg-[#F0FEFA] border-[#B8F0E8] dark:bg-teal-950/20 dark:border-teal-900/40'
            : 'bg-[#F8FAFC] border-slate-100 dark:bg-slate-900/40 dark:border-slate-700'
        }`}
      >
        <div className={`mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full text-base font-medium ${
          item.done ? 'bg-[#2ED6C5] text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
        }`}>
          {item.done ? '✓' : item.count}
        </div>
        <p className="text-base font-normal leading-snug text-slate-600 dark:text-slate-300 break-keep">
          {item.title}
        </p>
        <p className="mt-1 text-base font-normal leading-snug text-[#8D9CAE] dark:text-slate-500 break-keep">
          {item.subtitle}
        </p>
      </div>
    ))}
  </div>
);

export default ReferralMilestoneGrid;
