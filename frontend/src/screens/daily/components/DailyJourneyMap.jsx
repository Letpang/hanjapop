import { getRankDetails } from '../../../utils/rankUtils.js';
import JourneyBackground from '../map/components/JourneyBackground.jsx';
import JourneyHeader from '../map/components/JourneyHeader.jsx';
import JourneyMainPath from '../map/components/JourneyMainPath.jsx';
import JourneyResultButton from '../map/components/JourneyResultButton.jsx';
import { getDailyCurrentStep, getStoredXp } from '../map/dailyJourneyMapUtils.js';
import { PULSE_CSS } from '../map/journeyMapAnimations.js';

const DailyJourneyMap = ({
  dayNumber,
  theme,
  charId,
  userXp,
  done,
  chosenGame,
  chosenQuiz,
  onTapNode,
  onShowResults,
  onBack,
  todayHanja = [],
}) => {
  const xpForCharacter = Number.isFinite(Number(userXp)) ? Number(userXp) : getStoredXp();
  const charImg = getRankDetails(xpForCharacter, charId).avatar;
  const currentStep = getDailyCurrentStep(done);
  const allDone = done.has('writing');

  return (
    <div className="fixed inset-0 flex flex-col overflow-y-auto ">
      <style>{PULSE_CSS}</style>
      <JourneyBackground />

      <JourneyHeader
        dayNumber={dayNumber}
        theme={theme}
        todayHanja={todayHanja}
        onBack={onBack}
      />

      <div className="relative z-10 flex flex-1 flex-col items-center px-4 pb-10 pt-4">
        <div className="mx-auto w-full max-w-sm">
          <JourneyMainPath
            charId={charId}
            charImg={charImg}
            chosenGame={chosenGame}
            chosenQuiz={chosenQuiz}
            currentStep={currentStep}
            done={done}
            onTapNode={onTapNode}
          />

          {allDone && <JourneyResultButton onShowResults={onShowResults} />}
        </div>
      </div>
    </div>
  );
};

export default DailyJourneyMap;
