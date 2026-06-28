import { useLang } from '../../../../hooks/useLang.js';

const GradeExamLevelMeter = ({ level }) => {
  const { t } = useLang();
  
  return (
    <span className="grade-exam-level-meter" aria-label={t('ext_1992', { level })}>
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={index < level ? 'is-active' : ''}
          aria-hidden="true"
        />
      ))}
    </span>
  );
};

export default GradeExamLevelMeter;
