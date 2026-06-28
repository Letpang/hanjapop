import DailyStagePanel from './DailyStagePanel.jsx';

const JourneyHeader = ({ dayNumber, theme, todayHanja, onBack }) => (
  <div className="relative z-10 flex w-full shrink-0 flex-col items-center px-4 pb-4 pt-12">
    <button onClick={onBack} className="hp-nav-button absolute left-4 top-12 z-10">←</button>
    <DailyStagePanel dayNumber={dayNumber} theme={theme} todayHanja={todayHanja} />
  </div>
);

export default JourneyHeader;
