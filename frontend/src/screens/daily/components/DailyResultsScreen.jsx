import { lazy, Suspense } from 'react';
import DAILY_CURRICULUM from '../../../data/dailyCurriculum.js';
import { useLang } from '../../../hooks/useLang.js';
import { getCharacterImage, getCharacterScale, getCharacterTranslateY } from '../../../utils/rankUtils.js';
import ResultModalShell from '../../../components/common/ResultModalShell.jsx';
import {
  getMainButtonSubtitle,
  getNextStageLabel,
} from '../results/dailyResultData.js';
import DailyResultContent from '../results/components/DailyResultContent.jsx';
import DailyResultShareCapture from '../results/components/DailyResultShareCapture.jsx';
import useDailyResultShare from '../results/hooks/useDailyResultShare.js';

const FinalJourneyCelebration = lazy(() => import('../FinalJourneyCelebration.jsx'));

const FINAL_HANJA_COUNT = new Set(
  DAILY_CURRICULUM.flatMap((day) => (day.hanja || []).map((item) => item.id).filter(Boolean))
).size;

const DailyResultsScreen = ({
  todayHanja,
  onComplete,
  onContinueNext,
  selectedCharacter,
  userNickname,
  dayNumber,
  missions,
  doneCount,
  clearMsg,
}) => {
  const { t } = useLang();
  const isFinalDay = dayNumber >= DAILY_CURRICULUM.length;
  const missionTotal = missions?.length || 6;
  const missionDone = doneCount || 0;
  const charImg = getCharacterImage(selectedCharacter, 'success');
  const resultCharacterScale = getCharacterScale(selectedCharacter, 'success');
  const resultCharacterTranslateY = getCharacterTranslateY(selectedCharacter, true);
  const {
    shareInviteCardRef,
    shareStatus,
    referralActivatedCount,
    referralShareSubtitle,
    handleDailyShare,
  } = useDailyResultShare({ todayHanja, userNickname, dayNumber });

  if (isFinalDay) {
    return (
      <Suspense fallback={<div className="min-h-screen " />}>
        <FinalJourneyCelebration
          selectedCharacter={selectedCharacter}
          userNickname={userNickname}
          hanjaCount={FINAL_HANJA_COUNT}
          onComplete={onComplete}
        />
      </Suspense>
    );
  }

  return (
    <ResultModalShell cardClassName="result-card-container" labelledBy="daily-result-title">
      <DailyResultShareCapture
        captureRef={shareInviteCardRef}
        selectedCharacter={selectedCharacter}
        userNickname={userNickname}
      />

      <DailyResultContent
        charImg={charImg}
        clearMsg={clearMsg}
        dayNumber={dayNumber}
        handleDailyShare={handleDailyShare}
        mainButtonSubtitle={getMainButtonSubtitle({ missionDone, missionTotal }, t)}
        missionDone={missionDone}
        missionTotal={missionTotal}
        nextStageLabel={getNextStageLabel(dayNumber, DAILY_CURRICULUM.length, t)}
        onComplete={onComplete}
        onContinueNext={onContinueNext}
        referralActivatedCount={referralActivatedCount}
        referralShareSubtitle={referralShareSubtitle}
        resultCharacterScale={resultCharacterScale}
        resultCharacterTranslateY={resultCharacterTranslateY}
        shareStatus={shareStatus}
        todayHanja={todayHanja}
      />
    </ResultModalShell>
  );
};

export default DailyResultsScreen;
