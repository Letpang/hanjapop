import { useCallback, useEffect, useRef, useState } from 'react';
import { createQuestions, getUnlockedGrade, setUnlockedGrade } from '../gradeTestRunnerUtils.js';
import { useLang } from '../../../../hooks/useLang.js';

export const useGradeTestRunner = ({
  questionsSource,
  passCount,
  typeLabels,
  unlockGrade,
  getAlreadyUnlocked,
  getHasPrereq,
  onBack,
  onComplete,
}) => {
  const { t } = useLang();
  const currentGrade = getUnlockedGrade();
  const alreadyUnlocked = getAlreadyUnlocked(currentGrade);
  const hasPrereq = getHasPrereq(currentGrade, alreadyUnlocked);
  const autoAdvanceTimerRef = useRef(null);

  const [questions, setQuestions] = useState(() => createQuestions(questionsSource));
  const [phase, setPhase] = useState('intro');
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [answerLog, setAnswerLog] = useState([]);

  const q = questions[qIndex];
  const passed = correct >= passCount;

  const resetQuiz = useCallback(() => {
    clearTimeout(autoAdvanceTimerRef.current);
    setQuestions(createQuestions(questionsSource));
    setPhase('intro');
    setQIndex(0);
    setSelected(null);
    setRevealed(false);
    setCorrect(0);
    setAnswerLog([]);
  }, [questionsSource]);

  const handleNext = useCallback(() => {
    clearTimeout(autoAdvanceTimerRef.current);
    if (qIndex + 1 >= questions.length) {
      setPhase('result');
      return;
    }

    setQIndex((i) => i + 1);
    setSelected(null);
    setRevealed(false);
  }, [qIndex, questions.length]);

  const handleSelect = useCallback((choice) => {
    if (selected !== null || !q) return;

    const isCorrect = choice === q.answer;
    setAnswerLog((prev) => [
      ...prev,
      {
        number: qIndex + 1,
        type: typeLabels[q.type] ? t(typeLabels[q.type]) : '',
        prompt: q.prompt,
        sentence: q.sentence || '',
        userAnswer: choice,
        correctAnswer: q.answer,
        isCorrect,
      },
    ]);
    setSelected(choice);

    if (isCorrect) {
      setCorrect((c) => c + 1);
      setRevealed(true);
      return;
    }

    autoAdvanceTimerRef.current = setTimeout(handleNext, 500);
  }, [handleNext, q, qIndex, selected, typeLabels]);

  useEffect(() => {
    if (!revealed) return undefined;
    autoAdvanceTimerRef.current = setTimeout(handleNext, 1200);
    return () => clearTimeout(autoAdvanceTimerRef.current);
  }, [handleNext, revealed]);

  useEffect(() => () => clearTimeout(autoAdvanceTimerRef.current), []);

  const handleFinish = useCallback(() => {
    if (passed && !alreadyUnlocked) {
      setUnlockedGrade(unlockGrade);
    }
    onComplete?.({ correct, total: questions.length, passed });
    onBack();
  }, [alreadyUnlocked, correct, onBack, onComplete, passed, questions.length, unlockGrade]);

  return {
    alreadyUnlocked,
    answerLog,
    correct,
    handleFinish,
    handleSelect,
    hasPrereq,
    passed,
    phase,
    q,
    qIndex,
    questionsLength: questions.length,
    resetQuiz,
    revealed,
    selected,
    startQuiz: () => setPhase('quiz'),
  };
};
