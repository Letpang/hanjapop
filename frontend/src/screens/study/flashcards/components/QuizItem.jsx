import { useState } from 'react';
import { getChoiceTextSizeClass } from '../../../../components/common/quiz-card/choiceTextSizing.js';
import { useLang } from '../../../../hooks/useLang.js';

const QuizItem = ({ q, idx, onAnswer }) => {
  const { t } = useLang();
  const [wrongChoices, setWrongChoices] = useState([]);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSelect = (choice) => {
    if (isCorrect || wrongChoices.includes(choice)) return;

    if (choice === q.answer) {
      setIsCorrect(true);
      onAnswer(q.id, wrongChoices.length === 0);
    } else {
      setWrongChoices(prev => [...prev, choice]);
    }
  };

  const renderPrompt = () => {
    if ((q.id === 'q_syn' || q.id === 'q_ant') && q.prompt.match(/^([^(]+)\((.+?)\)(.*)$/)) {
      const match = q.prompt.match(/^([^(]+)\((.+?)\)(.*)$/);
      return (
        <>
          <span className="hanja-char text-[#4F56D9] text-[2.3rem] align-middle mr-1">{match[1]}</span>
          <span className="text-base text-[#7882A0] align-middle mr-1">({match[2]})</span>
          <span className="align-middle">{q.promptSuffix ? t(q.promptSuffix) : match[3]}</span>
        </>
      );
    }
    if (q.promptKey) return t(q.promptKey, q.promptParams);
    return q.prompt;
  };

  return (
    <div className="study-sheet-quiz-item flex flex-col gap-5">
      <div className="study-sheet-quiz-prompt-row flex items-start gap-3 text-left">
        <span className="w-9 h-9 rounded-xl bg-[#F4F7F8] flex items-center justify-center text-base font-normal text-[#AEB7C5] border border-[#E9EDF2] uppercase tracking-widest shrink-0">Q{idx + 1}</span>
        <p className="study-sheet-quiz-prompt font-normal text-[#3C3C3C] dark:text-slate-100 tracking-normal break-keep flex-1">
          {renderPrompt()}
        </p>
      </div>
      <div className="quiz-choice-grid" style={['q_sound', 'q_syn', 'q_ant'].includes(q.id) ? { gridTemplateColumns: 'repeat(2, 1fr)' } : undefined}>
        {(() => {
          const maxLen = Math.max(...q.choices.map(c => {
            if (typeof c !== 'string') return 0;
            return c.replace(/\s+/g, '').length;
          }));
          const textSizeClass = maxLen >= 6
            ? 'quiz-choice-btn--text-long'
            : maxLen >= 4
            ? 'quiz-choice-btn--text-medium'
            : '';

          return q.choices.map((choice, i) => {
            const isWrong = wrongChoices.includes(choice);
            const isRight = isCorrect && choice === q.answer;
            const cls = `quiz-choice-btn ${q.choiceType === 'hanja' ? 'quiz-choice-btn--hanja' : ''} ${textSizeClass} ${isRight ? 'quiz-choice-btn--correct' : isWrong ? 'quiz-choice-btn--wrong' : ''}`;

            let content = <span className="break-keep">{choice}</span>;

          if (typeof choice === 'string' && (q.id === 'q_syn' || q.id === 'q_ant')) {
            const match = choice.match(/^([^(]+)\((.+)\)$/);
            if (match) {
              content = (
                <div className="flex flex-col items-start justify-center w-full gap-1.5 py-2 text-left">
                  <span className={`hanja-char text-[2rem] leading-none ${isRight ? 'text-[#4F56D9]' : isWrong ? 'text-[#FF8D72]' : 'text-[#3C3C3C] dark:text-slate-100'}`}>{match[1]}</span>
                  <span className={`text-base font-normal tracking-normal ${isRight ? 'text-[#7C83FF]' : isWrong ? 'text-[#FFA88D]' : 'text-[#7882A0]'}`}>{match[2]}</span>
                </div>
              );
            }
          }

          if (q.choiceType === 'hanja' && q.readingMap?.[choice]) {
            content = (
              <span className="flex items-baseline gap-1.5 break-keep">
                <span className={`hanja-char ${isRight ? 'text-[#4F56D9]' : isWrong ? 'text-[#FF8D72]' : ''}`}>{choice}</span>
                <span className="text-xl font-normal text-[#AEB7C5]">{q.readingMap[choice]}</span>
              </span>
            );
          }

          return (
            <button key={i} className={cls} onClick={() => handleSelect(choice)}>
              {content}
            </button>
          );
        });
      })()}
      </div>
    </div>
  );
};

export default QuizItem;
