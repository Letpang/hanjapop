import GradeReviewPanel from './journey/GradeReviewPanel.jsx';
import JourneyMonsterHint from './journey/JourneyMonsterHint.jsx';
import JourneyPrimaryButton from './journey/JourneyPrimaryButton.jsx';
import JourneyProgressButton from './journey/JourneyProgressButton.jsx';

const JourneyCtaPanel = ({
  selectedGrade,
  selectedPastStage,
  isDailyComplete,
  isStageLocked,
  isJourneyComplete,
  journeyRound,
  currentDay,
  targetStage,
  isDarkMode,
  onSelectGrade,
  onPrimaryCta,
  style,
}) => {
  if (selectedGrade) {
    return (
      <GradeReviewPanel
        selectedGrade={selectedGrade}
        onSelectGrade={onSelectGrade}
        style={style}
      />
    );
  }

  const ctaIsHot = selectedPastStage || isDailyComplete;

  return (
    <div className="w-full max-w-md relative" style={style}>
      <JourneyMonsterHint
        isDailyComplete={isDailyComplete}
        currentDay={currentDay}
      />

      <div
        className="w-full rounded-[1.5rem] overflow-hidden relative z-10 border border-white/80 shadow-[0_18px_40px_rgba(80,96,120,0.12)]"
        style={isDarkMode ? { background: '#1e293b' } : { background: '#FFFFFF' }}
      >
        <JourneyPrimaryButton
          ctaIsHot={ctaIsHot}
          isDarkMode={isDarkMode}
          isStageLocked={isStageLocked}
          isDailyComplete={isDailyComplete}
          selectedPastStage={selectedPastStage}
          isJourneyComplete={isJourneyComplete}
          journeyRound={journeyRound}
          targetStage={targetStage}
          onPrimaryCta={onPrimaryCta}
        />

        <JourneyProgressButton
          ctaIsHot={ctaIsHot}
          isDarkMode={isDarkMode}
          isJourneyComplete={isJourneyComplete}
          journeyRound={journeyRound}
          currentDay={currentDay}
          onPrimaryCta={onPrimaryCta}
        />
      </div>
    </div>
  );
};

export default JourneyCtaPanel;
