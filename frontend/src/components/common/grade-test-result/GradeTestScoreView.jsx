import CtaButton from '../CtaButton.jsx';
import ResultModalShell, {
  ResultModalActions,
  ResultModalHeading,
  ResultSecondaryButton,
  ResultShareButton,
} from '../ResultModalShell.jsx';
import GradeTestScoreCard from './GradeTestScoreCard.jsx';
import GradeTestUnlockCard from './GradeTestUnlockCard.jsx';
import { useLang } from '../../../hooks/useLang.js';

const GradeTestScoreView = ({
  alreadyUnlocked,
  badgeImage,
  cardRef,
  characterImage,
  characterStyle,
  correct,
  grade,
  onFinish,
  onRetry,
  onShare,
  onShowReport,
  passCount,
  passed,
  percent,
  shareStatus,
  subtitle,
  title,
  total,
  unlockText,
}) => {
  const { t } = useLang();

  return (
    <ResultModalShell
      ref={cardRef}
      tone={passed ? 'clear' : 'fail'}
      size="md"
      cardClassName="grade-test-result-card flex flex-col items-center text-center"
      labelledBy="grade-test-result-title"
    >
      <img
        src={characterImage}
        alt=""
        className="w-36 h-36 object-contain mb-1 drop-shadow-[0_18px_28px_rgba(91,103,122,0.12)]"
        style={characterStyle}
      />
      <ResultModalHeading
        id="grade-test-result-title"
        tone={passed ? 'clear' : 'fail'}
        kicker={passed ? t('ext_1794') : t('ext_2032')}
        title={title}
        description={subtitle}
      />

      <GradeTestScoreCard
        correct={correct}
        passCount={passCount}
        passed={passed}
        percent={percent}
        total={total}
      />

      <GradeTestUnlockCard
        badgeImage={badgeImage}
        show={passed && !alreadyUnlocked}
        unlockText={unlockText}
      />

      <ResultModalActions className="mt-5">
        <CtaButton onClick={onShowReport} theme="indigo">{t('ext_1479')}</CtaButton>
        {!passed && <CtaButton onClick={onRetry} theme="coral"><span className="quiz-cta-text">{t('ext_1555')}</span></CtaButton>}
        <ResultSecondaryButton onClick={onFinish}>
          {passed ? t('ext_276') : t('ext_1068')}
        </ResultSecondaryButton>
        {passed && (
          <>
            <ResultShareButton
              onClick={onShare}
              title={t('ext_1791')}
              subtitle={t('ext_2224', { grade })}
            />
            {shareStatus && <p className="text-center text-base text-slate-400 -mt-1.5">{shareStatus}</p>}
          </>
        )}
      </ResultModalActions>
    </ResultModalShell>
  );
};

export default GradeTestScoreView;