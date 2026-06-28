import { useCallback, useMemo, useRef, useState } from 'react';
import { pickClearMessage } from '../../../../constants/messages.js';
import { getRankDetails } from '../../../../utils/rankUtils.js';
import { buildIdiomQuiz, clearIdiomWrong, writeIdiomWrong } from '../idiomQuizUtils.js';

const useIdiomQuiz = ({
  idioms,
  allIdioms,
  onComplete,
  userXp,
  selectedCharacter,
  missionDone,
}) => {
  const questions = useMemo(() => buildIdiomQuiz(idioms, allIdioms), [allIdioms, idioms]);
  const [idx, setIdx] = useState(0);
  const [resultClearMsg] = useState(() => pickClearMessage());
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [currentAnswered, setCurrentAnswered] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const clearCountRef = useRef(0);
  const missionXpGrantedRef = useRef(0);

  const characterAvatar = useMemo(() => {
    if (!selectedCharacter) return null;
    return getRankDetails(userXp || 0, selectedCharacter).avatar;
  }, [userXp, selectedCharacter]);

  const question = questions[idx];

  const handleCorrect = useCallback((isFirstAttempt) => {
    setCurrentAnswered(true);
    if (isFirstAttempt) {
      setScore(value => value + 1);
      clearIdiomWrong(question);
    }
  }, [question]);

  const handleWrong = useCallback(() => {
    writeIdiomWrong(question);
  }, [question]);

  const resetQuiz = useCallback(() => {
    setIdx(0);
    setScore(0);
    setDone(false);
    setCompleting(false);
    setCurrentAnswered(false);
  }, []);

  const handleNext = useCallback(() => {
    setCurrentAnswered(false);
    if (idx + 1 >= questions.length) {
      setCompleting(true);
      const willGrantMission = !missionDone && clearCountRef.current === 0;
      clearCountRef.current += 1;
      missionXpGrantedRef.current = willGrantMission ? 25 : 0;
      onComplete?.(score);
      setDone(true);
      return;
    }

    setIdx(value => value + 1);
  }, [idx, missionDone, onComplete, questions.length, score]);

  const handlePrev = useCallback(() => {
    if (idx === 0) return;
    setCurrentAnswered(false);
    setIdx(value => value - 1);
  }, [idx]);

  return {
    characterAvatar,
    completing,
    currentAnswered,
    done,
    handleCorrect,
    handleNext,
    handlePrev,
    handleWrong,
    idx,
    missionXpGranted: missionXpGrantedRef.current,
    question,
    questions,
    resetQuiz,
    resultClearMsg,
    score,
    setCurrentAnswered,
    setShowExitModal,
    showExitModal,
  };
};

export default useIdiomQuiz;
