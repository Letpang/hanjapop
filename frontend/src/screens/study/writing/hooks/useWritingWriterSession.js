import { useCallback } from 'react';
import {
  WRONG_PENALTY,
  WRITER_CHAR_MAP,
} from '../writingConstants.js';

export const useWritingWriterSession = ({
  activeStrokeIndexRef,
  checkStrokeCompletion,
  hanja,
  markComplete,
  quizContainerRef,
  setActiveStrokeIndex,
  setMistakeOnStroke,
  setScore,
  writerRef,
}) => {
  const createWriter = useCallback((color, width, showNumbers = true) => {
    if (!quizContainerRef.current || !window.HanziWriter) return null;
    quizContainerRef.current.innerHTML = '';
    const containerSize = quizContainerRef.current.offsetWidth;
    const writerChar = WRITER_CHAR_MAP[hanja.hanja] || hanja.hanja;

    return window.HanziWriter.create(quizContainerRef.current, writerChar, {
      width: containerSize,
      height: containerSize,
      padding: containerSize * 0.08,
      showOutline: showNumbers,
      strokeColor: color,
      outlineColor: 'rgba(0,0,0,0.1)',
      drawingColor: color,
      drawingWidth: width,
      showHintAfterMisses: false,
      highlightOnComplete: true,
      highlightColor: '#FFB433',
      showCharacter: true,
      charColor: 'rgba(0,0,0,0.05)',
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 200,
    });
  }, [hanja, quizContainerRef]);

  const startQuiz = useCallback((writer) => {
    if (!writer) return;
    setActiveStrokeIndex(0);
    writer.quiz({
      onMistake: () => {
        setScore(s => Math.max(0, s - WRONG_PENALTY));
        setMistakeOnStroke(true);
        setTimeout(() => setMistakeOnStroke(false), 600);
      },
      onCorrectStroke: (strokeData) => {
        setMistakeOnStroke(false);
        if (strokeData && typeof strokeData.strokeNum === 'number') {
          const nextStrokeIndex = strokeData.strokeNum + 1;
          activeStrokeIndexRef.current = nextStrokeIndex;
          setActiveStrokeIndex(nextStrokeIndex);
          checkStrokeCompletion(nextStrokeIndex);
        } else {
          setActiveStrokeIndex(prev => {
            const nextStrokeIndex = prev + 1;
            activeStrokeIndexRef.current = nextStrokeIndex;
            checkStrokeCompletion(nextStrokeIndex);
            return nextStrokeIndex;
          });
        }
      },
      onComplete: () => {
        markComplete();
      },
    });
  }, [
    activeStrokeIndexRef,
    checkStrokeCompletion,
    markComplete,
    setActiveStrokeIndex,
    setMistakeOnStroke,
    setScore,
  ]);

  const restartWriterQuiz = useCallback((color, width) => {
    const writer = createWriter(color, width);
    writerRef.current = writer;
    startQuiz(writer);
    return writer;
  }, [createWriter, startQuiz, writerRef]);

  return {
    createWriter,
    restartWriterQuiz,
    startQuiz,
  };
};
