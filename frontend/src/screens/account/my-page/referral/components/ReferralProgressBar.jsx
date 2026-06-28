const ReferralProgressBar = ({ progress }) => (
  <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shadow-inner">
    <div
      className="h-full rounded-full transition-all duration-700"
      style={{
        width: `${progress}%`,
        background: 'linear-gradient(90deg, #2ED6C5, #7C83FF, #FF9B73)',
      }}
    />
  </div>
);

export default ReferralProgressBar;
