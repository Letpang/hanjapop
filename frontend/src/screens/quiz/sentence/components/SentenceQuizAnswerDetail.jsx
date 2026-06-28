import HANJA_DATA from '../../../../hanja_unified.json';
import { SpeakButton } from '../../../../components/common/QuizCard.jsx';

const getUniqueHanjaChips = (word) => {
  const seenChars = new Set();

  return [...(word || '')]
    .map((char) => {
      const hanja = HANJA_DATA.find((item) => item.hanja === char);
      return hanja ? { char, meaning: hanja.meaning, sound: hanja.sound } : null;
    })
    .filter(Boolean)
    .filter(({ char }) => {
      if (seenChars.has(char)) return false;
      seenChars.add(char);
      return true;
    });
};

const getTermSizeClass = (wordLength) => {
  if (wordLength <= 2) return 'word-quiz-term--short';
  if (wordLength === 3) return 'word-quiz-term--medium';
  if (wordLength === 4) return 'word-quiz-term--idiom';
  return 'word-quiz-term--short';
};

const SentenceQuizAnswerDetail = ({ currentQuiz, isSpeaking, meaning, onSpeak, reading, word }) => {
  const backWord = currentQuiz.type === 'sentence' ? word : currentQuiz.char;
  const backReading = currentQuiz.type === 'sentence' ? reading : currentQuiz.sound;
  const backMeaning = currentQuiz.type === 'sentence' ? meaning : currentQuiz.meaning;
  const charChips = getUniqueHanjaChips(backWord);

  return (
    <div className="quiz-card-answer-detail flex flex-col h-full px-3 pt-2 pb-3">
      <div className="quiz-card-answer-toolbar flex justify-end shrink-0">
        <SpeakButton isSpeaking={isSpeaking} onSpeak={(event) => { event.stopPropagation(); onSpeak(event); }} />
      </div>
      <div className="quiz-card-answer-main flex-1 flex flex-col items-center justify-center gap-4">
        <span className={`word-quiz-term hanja-char font-normal text-[#1e293b] dark:text-slate-50 drop-shadow-sm text-center leading-none ${getTermSizeClass((backWord || '').length)}`}>
          {backWord}
        </span>
        <span className="quiz-card-answer-reading text-[1.45rem] font-normal text-slate-500 dark:text-slate-400 leading-tight">{backReading}</span>
        {charChips.length > 0 ? (
          <div className="quiz-card-hanja-chips flex items-center gap-2.5 flex-wrap justify-center max-w-full">
            {charChips.map(({ char, meaning: chipMeaning, sound }) => (
              <div key={char} className="quiz-card-hanja-chip flex items-center gap-1.5 bg-[#EEF0FF] dark:bg-indigo-950/40 rounded-2xl px-3 py-2 shadow-sm">
                <span className="hanja-char font-normal text-[#334155] dark:text-slate-200 leading-none">{char}</span>
                <span className="text-[#8F99AD] leading-none">{chipMeaning}</span>
                <span className="font-medium text-[color:var(--color-text-muted)] dark:text-slate-300 leading-none">{sound}</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="quiz-card-answer-meaning text-slate-400 text-center leading-snug">{backMeaning}</span>
        )}
      </div>
    </div>
  );
};

export default SentenceQuizAnswerDetail;
