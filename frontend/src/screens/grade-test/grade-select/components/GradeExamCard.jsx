import GradeExamLevelMeter from './GradeExamLevelMeter.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const GradeExamCard = ({ item, onSelectGrade }) => {
  const { label, range, desc, accent, accentDeep, level } = item;
  const { t } = useLang();

  return (
    <button
      onClick={() => onSelectGrade(label)}
      className="grade-exam-card"
      style={{ '--grade-accent': accent, '--grade-accent-deep': accentDeep }}
    >
      <span className="grade-exam-card-stripe" aria-hidden="true" />
      <span className="grade-exam-card-shine" aria-hidden="true" />
      <span className="grade-exam-badge" aria-hidden="true">{label}</span>

      <span className="grade-exam-card-body">
        <span className="grade-exam-card-heading">
          <span className="grade-exam-card-title">{t('ext_1871', { label })}</span>
          <span className="grade-exam-range">{t(range)}</span>
        </span>
        <span className="grade-exam-card-desc">{t(desc)}</span>
        <span className="grade-exam-level-row">
          <span className="grade-exam-level-label">{t('ext_1872', { level })}</span>
          <GradeExamLevelMeter level={level} />
        </span>
      </span>

      <span className="grade-exam-card-action" aria-hidden="true">
        <span className="grade-exam-chevron" />
      </span>
    </button>
  );
};

export default GradeExamCard;