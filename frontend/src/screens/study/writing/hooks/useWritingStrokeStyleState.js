import { useEffect, useRef, useState } from 'react';
import { STROKE_WIDTHS } from '../writingConstants.js';

export const useWritingStrokeStyleState = () => {
  const [strokeColor, setStrokeColor] = useState('#34383F');
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS[1].value);
  const strokeStyleRef = useRef({ color: strokeColor, width: strokeWidth });

  useEffect(() => {
    strokeStyleRef.current = { color: strokeColor, width: strokeWidth };
  }, [strokeColor, strokeWidth]);

  return {
    setStrokeColor,
    setStrokeWidth,
    strokeColor,
    strokeStyleRef,
    strokeWidth,
  };
};
