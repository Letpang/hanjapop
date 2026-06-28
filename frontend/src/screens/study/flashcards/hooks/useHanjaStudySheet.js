import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import IDIOMS from '../../../../data/idioms.js';
import { localizeIdiom } from '../../../../data/idiomI18nKeys.js';
import { playCardSound } from '../flashcardAudio.js';
import { buildWorksheetQuiz } from '../flashcardData.js';
import { useLang } from '../../../../hooks/useLang.js';

const initialOpenSections = {
  words: false,
  idioms: false,
  synAnt: false,
  quiz: false,
};

const getRelatedIdioms = (item, t) => (
  (item.words || [])
    .filter(word => word.type === 'idiom')
    .map(word => IDIOMS.find(idiom => idiom.hanja === word.word))
    .filter(Boolean)
    .map(idiom => localizeIdiom(idiom, t))
);

const useHanjaStudySheet = ({
  item,
  onBack,
  onMarkCorrect,
  onMarkWrong,
  onMarkWordWrong,
  onHanjaAcquired,
  isSequence,
  onNext,
  isLast,
  onStudySheetComplete,
  onQuizXp,
}) => {
  const { t } = useLang();
  const questions = useMemo(() => buildWorksheetQuiz(item), [item]);
  const regularWords = useMemo(() => (item.words || []).filter(w => w.type !== 'idiom'), [item]);
  const relatedIdioms = useMemo(() => getRelatedIdioms(item, t), [item, t]);
  const hasSynAnt = (item.syn && item.syn.length > 0) || (item.ant && item.ant.length > 0);

  const [answers, setAnswers] = useState({});
  const [openSections, setOpenSections] = useState(initialOpenSections);
  const [quizDone, setQuizDone] = useState(false);
  const [xpPopup, setXpPopup] = useState({ show: false, key: 0, amount: 0 });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const completionAwardedRef = useRef(false);
  const answeredQuestionIdsRef = useRef(new Set());

  useEffect(() => {
    setIsSpeaking(true);
    return playCardSound(item, () => setIsSpeaking(false));
  }, [item]);

  const answerCount = Object.keys(answers).length;
  const correctAnswerCount = Object.values(answers).filter(Boolean).length;
  const completionLabel = isSequence ? (isLast ? t('ext_1785') : t('ext_1735')) : t('ext_1685');

  const toggleSection = useCallback((section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const speak = useCallback(() => {
    setIsSpeaking(true);
    playCardSound(item, () => setIsSpeaking(false));
  }, [item]);

  const hideXpPopup = useCallback(() => {
    setXpPopup(popup => ({ ...popup, show: false }));
  }, []);

  const handleAnswer = useCallback((qId, isCorrect) => {
    if (answeredQuestionIdsRef.current.has(qId)) return;
    answeredQuestionIdsRef.current.add(qId);

    const next = { ...answers, [qId]: isCorrect };
    setAnswers(next);

    if (isCorrect && onHanjaAcquired) {
      onHanjaAcquired(item.id, 5);
      setXpPopup({ show: true, key: Date.now(), amount: 5 });
      setTimeout(hideXpPopup, 1500);
    }

    if (!isCorrect) {
      const question = questions.find(q => q.id === qId);
      if (question?.wordId != null && onMarkWordWrong) {
        onMarkWordWrong(question.wordId, item.id, question.reading, question.meaning);
      } else if (onMarkWrong) {
        onMarkWrong(item.id);
      }
    }

    if (Object.keys(next).length >= questions.length) {
      const correct = Object.values(next).filter(Boolean).length;
      if (correct >= Math.ceil(questions.length * 0.7) && onMarkCorrect) {
        onMarkCorrect(item.id);
      }
    }
  }, [
    answers,
    hideXpPopup,
    item.id,
    onHanjaAcquired,
    onMarkCorrect,
    onMarkWordWrong,
    onMarkWrong,
    questions,
  ]);

  const finishStudySheet = useCallback((afterComplete) => {
    if (!completionAwardedRef.current) {
      completionAwardedRef.current = true;
      onQuizXp?.(correctAnswerCount * 5);
    }

    onStudySheetComplete?.(item.id);
    afterComplete?.();
  }, [correctAnswerCount, item.id, onQuizXp, onStudySheetComplete]);

  const handleWritingNext = useCallback(() => {
    if (isSequence && isLast) {
      finishStudySheet();
      setQuizDone(true);
      return;
    }

    if (isSequence) {
      finishStudySheet(onNext);
      return;
    }

    finishStudySheet(onBack);
  }, [finishStudySheet, isLast, isSequence, onBack, onNext]);

  return {
    answerCount,
    answers,
    completionLabel,
    correctAnswerCount,
    handleAnswer,
    handleWritingNext,
    hasSynAnt,
    isSpeaking,
    openSections,
    questions,
    quizDone,
    regularWords,
    relatedIdioms,
    setQuizDone,
    speak,
    toggleSection,
    xpPopup,
  };
};

export default useHanjaStudySheet;
