import { useEffect } from 'react';
import HANJA_DATA from '../../../../hanja_unified.json';
import { getShootTargetSelection } from '../shootGameUtils.js';

export const useShootTargetSelection = ({
  diffConfig,
  gameChars,
  setIsWordTarget,
  setOptions,
  setTargetId,
  status,
  targetId,
  words,
}) => {
  useEffect(() => {
    if (status !== 'playing' || words.length === 0) {
      const timer = setTimeout(() => {
        setOptions([]);
        setTargetId(null);
      }, 0);
      return () => clearTimeout(timer);
    }
    const selection = getShootTargetSelection({
      allHanja: HANJA_DATA,
      diffConfig,
      gameChars,
      targetId,
      words,
    });
    if (selection) {
      const timer = setTimeout(() => {
        setTargetId(selection.targetId);
        setIsWordTarget(selection.isWordTarget);
        setOptions(selection.options);
      }, 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [
    diffConfig,
    gameChars,
    setIsWordTarget,
    setOptions,
    setTargetId,
    status,
    targetId,
    words,
  ]);
};
