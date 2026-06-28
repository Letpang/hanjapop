import { useEffect, useRef, useState } from 'react';
import {
  ANIMCJK_CHARS,
  WRITER_CHAR_MAP,
} from '../writingConstants.js';
import {
  drawStrokeNumberOverlay,
  fetchStrokeOrderSvg,
  renderStrokeOrderSvg,
  setupAnimCjkCanvas,
} from '../writingCanvasUtils.js';
import { useWritingQuizProgress } from './useWritingQuizProgress.js';
import { useWritingStrokeStyleState } from './useWritingStrokeStyleState.js';
import { useWritingToolHandlers } from './useWritingToolHandlers.js';
import { useWritingWriterSession } from './useWritingWriterSession.js';

export const useWritingQuizEngine = ({ hanja, onWritingComplete }) => {
  const quizContainerRef = useRef(null);
  const strokeNumberCanvasRef = useRef(null);
  const drawingCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const writerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [noData, setNoData] = useState(false);
  const [charData, setCharData] = useState(null);

  const [strokeOrderSvg, setStrokeOrderSvg] = useState(null);
  const [strokeOrderKey, setStrokeOrderKey] = useState(0);
  const [showStrokeModal, setShowStrokeModal] = useState(false);

  const isAnimCJK = ANIMCJK_CHARS.has(hanja.hanja);

  const {
    activeStrokeIndex,
    activeStrokeIndexRef,
    charDataRef,
    checkStrokeCompletion,
    isAnimating,
    isComplete,
    markComplete,
    mistakeOnStroke,
    resetQuizProgress,
    score,
    setActiveStrokeIndex,
    setIsAnimating,
    setMistakeOnStroke,
    setScore,
  } = useWritingQuizProgress({ hanja, onWritingComplete });

  const {
    setStrokeColor,
    setStrokeWidth,
    strokeColor,
    strokeStyleRef,
    strokeWidth,
  } = useWritingStrokeStyleState();

  const {
    createWriter,
    restartWriterQuiz,
    startQuiz,
  } = useWritingWriterSession({
    activeStrokeIndexRef,
    checkStrokeCompletion,
    hanja,
    markComplete,
    quizContainerRef,
    setActiveStrokeIndex,
    setMistakeOnStroke,
    setScore,
    writerRef,
  });

  useEffect(() => {
    const container = quizContainerRef.current;
    if (!container) return undefined;

    if (isAnimCJK) {
      const abortCtrl = new AbortController();
      fetchStrokeOrderSvg(hanja.hanja, { signal: abortCtrl.signal })
        .then(svg => {
          renderStrokeOrderSvg(container, svg);
          setIsReady(true);
        })
        .catch(() => { setIsReady(true); });
      return () => { abortCtrl.abort(); container.innerHTML = ''; };
    }

    if (!window.HanziWriter) return undefined;
    const { color, width } = strokeStyleRef.current;
    const writer = createWriter(color, width);
    if (!writer) return undefined;
    writerRef.current = writer;

    const resetTimer = setTimeout(() => {
      resetQuizProgress();
      startQuiz(writer);
    }, 0);

    const fetchChar = WRITER_CHAR_MAP[hanja.hanja] || hanja.hanja;
    charDataRef.current = null;
    setNoData(false);
    const abortCtrl = new AbortController();
    fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${fetchChar}.json`, { signal: abortCtrl.signal })
      .then(r => {
        if (!r.ok) throw new Error('not_found');
        return r.json();
      })
      .then(data => {
        charDataRef.current = data;
        setCharData(data);
        setIsReady(true);
        const strokeCount = data?.medians?.length || 0;
        if (strokeCount > 0 && activeStrokeIndexRef.current >= strokeCount) markComplete();
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setIsReady(true);
        setNoData(true);
      });

    return () => {
      clearTimeout(resetTimer);
      abortCtrl.abort();
      container.innerHTML = '';
    };
  }, [hanja, createWriter, isAnimCJK, markComplete, resetQuizProgress, startQuiz]);

  useEffect(() => {
    if (!isAnimCJK) return undefined;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return undefined;
    isDrawingRef.current = false;
    return setupAnimCjkCanvas(canvas, strokeStyleRef, isDrawingRef);
  }, [hanja, isAnimCJK]);

  useEffect(() => {
    drawStrokeNumberOverlay({
      canvas: strokeNumberCanvasRef.current,
      charData,
      isComplete,
      activeStrokeIndex,
    });
  }, [charData, isComplete, activeStrokeIndex]);

  const {
    handleColorChange,
    handleHint,
    handleRetry,
    handleStrokeModalClose,
    handleStrokeModalReplay,
    handleWidthChange,
    replayAnimCjk,
  } = useWritingToolHandlers({
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
  });

  return {
    drawingCanvasRef,
    handleColorChange,
    handleHint,
    handleRetry,
    handleStrokeModalClose,
    handleStrokeModalReplay,
    handleWidthChange,
    isAnimCJK,
    isAnimating,
    isComplete,
    isReady,
    mistakeOnStroke,
    noData,
    quizContainerRef,
    replayAnimCjk,
    showStrokeModal,
    strokeColor,
    strokeNumberCanvasRef,
    strokeOrderKey,
    strokeOrderSvg,
    strokeWidth,
  };
};
