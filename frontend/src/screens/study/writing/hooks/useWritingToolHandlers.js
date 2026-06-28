import {
  clearDrawingCanvas,
  fetchStrokeOrderSvg,
  renderStrokeOrderSvg,
} from '../writingCanvasUtils.js';
import { HINT_PENALTY } from '../writingConstants.js';

export const useWritingToolHandlers = ({
  drawingCanvasRef,
  hanja,
  isAnimating,
  isAnimCJK,
  isComplete,
  quizContainerRef,
  resetQuizProgress,
  restartWriterQuiz,
  setIsAnimating,
  setScore,
  setShowStrokeModal,
  setStrokeColor,
  setStrokeOrderKey,
  setStrokeOrderSvg,
  setStrokeWidth,
  startQuiz,
  strokeColor,
  strokeWidth,
  writerRef,
}) => {
  const handleColorChange = (color) => {
    if (!isAnimCJK) {
      if (isComplete || isAnimating) return;
      restartWriterQuiz(color, strokeWidth);
    }
    setStrokeColor(color);
  };

  const handleWidthChange = (width) => {
    if (!isAnimCJK) {
      if (isComplete || isAnimating) return;
      restartWriterQuiz(strokeColor, width);
    }
    setStrokeWidth(width);
  };

  const handleHint = () => {
    if (isComplete || isAnimating) return;

    if (isAnimCJK) {
      fetchStrokeOrderSvg(hanja.hanja)
        .then(svg => {
          setStrokeOrderSvg(svg);
          setShowStrokeModal(true);
        });
      return;
    }

    if (!writerRef.current) return;
    setScore(s => Math.max(0, s - HINT_PENALTY));
    setIsAnimating(true);
    try { writerRef.current.cancelQuiz(); } catch {}
    writerRef.current.animateCharacter({
      onComplete: () => {
        setIsAnimating(false);
        if (writerRef.current) startQuiz(writerRef.current);
      },
    });
  };

  const handleRetry = () => {
    resetQuizProgress();
    restartWriterQuiz(strokeColor, strokeWidth);
  };

  const replayAnimCjk = () => {
    const container = quizContainerRef.current;
    if (!container) return;

    clearDrawingCanvas(drawingCanvasRef.current);
    fetchStrokeOrderSvg(hanja.hanja).then(svg => renderStrokeOrderSvg(container, svg));
  };

  return {
    handleColorChange,
    handleHint,
    handleRetry,
    handleStrokeModalClose: () => setShowStrokeModal(false),
    handleStrokeModalReplay: () => setStrokeOrderKey(k => k + 1),
    handleWidthChange,
    replayAnimCjk,
  };
};
