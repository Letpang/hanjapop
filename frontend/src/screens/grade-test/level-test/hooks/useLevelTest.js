import { useMemo, useRef, useState } from 'react';
import {
  SORTED_HANJA,
  buildLevelTestQuestions,
  getLevelTestBonus,
  getTotalDays,
  saveLevelTestBonus,
} from '../levelTestUtils.js';

const useLevelTest = ({ onBack, onComplete, onHanjaAcquired }) => {
  const currentBonus = getLevelTestBonus();
  const totalDays = getTotalDays();
  const unlockedCount = totalDays * 3 + currentBonus;
  const unlockedHanja = useMemo(() => SORTED_HANJA.slice(0, unlockedCount), [unlockedCount]);
  const questions = useMemo(() => buildLevelTestQuestions(unlockedHanja), [unlockedHanja]);
  const passThreshold = Math.max(1, Math.ceil(questions.length * 0.7));

  const [phase, setPhase] = useState('intro');
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [xpPopup, setXpPopup] = useState({ show: false, key: 0, amount: 0 });
  const xpPopupKeyRef = useRef(0);

  const currentQuestion = questions[Math.min(qIndex, questions.length - 1)];
  const answerValues = Object.values(answers);
  const correctCount = answerValues.filter(Boolean).length;
  const passed = correctCount >= passThreshold;
  const progress = questions.length > 0 ? (qIndex / questions.length) * 100 : 0;
  const isHanjaDisplay = currentQuestion?.qType === 'meaning' || currentQuestion?.qType === 'sound';

  const handleStart = () => {
    if (unlockedHanja.length < 3) return;
    setPhase('quiz');
    setQIndex(0);
    setAnswers({});
    setSelected(null);
    setRevealed(false);
  };

  const handleSelect = (choice) => {
    if (revealed || !currentQuestion) return;

    const isCorrect = choice === currentQuestion.answer;
    setSelected(choice);
    setRevealed(true);
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: isCorrect }));

    if (isCorrect) {
      onHanjaAcquired?.(currentQuestion.item?.id || null, 10);
      xpPopupKeyRef.current += 1;
      setXpPopup({ show: true, key: xpPopupKeyRef.current, amount: 10 });
      setTimeout(() => setXpPopup(popup => ({ ...popup, show: false })), 1500);
    }
  };

  const handleNext = () => {
    if (qIndex + 1 >= questions.length) {
      setPhase('result');
      onComplete?.({ correct: correctCount, total: questions.length });
      return;
    }

    setQIndex(prev => prev + 1);
    setSelected(null);
    setRevealed(false);
  };

  const handleFinish = () => {
    if (passed) {
      saveLevelTestBonus(currentBonus + 2);
    }
    onBack();
  };

  return {
    answers,
    correctCount,
    currentQuestion,
    handleFinish,
    handleNext,
    handleSelect,
    handleStart,
    isHanjaDisplay,
    passThreshold,
    passed,
    phase,
    progress,
    qIndex,
    questions,
    revealed,
    selected,
    setPhase,
    unlockedHanja,
    xpPopup,
  };
};

export default useLevelTest;
