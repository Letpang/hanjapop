import { useLang } from '../../../../hooks/useLang.js';

const WordQuizFrontContent = ({ q }) => {
  const { t } = useLang();
  
  return (
    <div className={`quiz-card-back__content ${(q.reading || '').length >= 4 ? 'quiz-card-back__content--dense' : ''}`}>
      <div className="quiz-card-back__reading-row">
        <span className={`quiz-card-back__reading ${(q.reading || '').length >= 4 ? 'quiz-card-back__reading--long' : ''}`}>{q.reading}</span>
        <span className="quiz-card-back__hanja hanja-char">({q.word})</span>
      </div>
      <div className="quiz-card-back__body">
        <p className={`quiz-card-back__text ${(q.example || '').length > 38 ? 'quiz-card-back__text--long' : ''}`}>
          <span className="quiz-card-back__badge">{t('ext_1056')}</span>
          {q.example ? q.example.replace(/\(\s*\)/g, q.word).trim().replace(/\s+/g, ' ') : ''}
        </p>
      </div>
    </div>
  );
};

export default WordQuizFrontContent;
