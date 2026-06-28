import { useEffect, useRef } from 'react';
import { getShootContentKey } from '../shootGameUtils.js';

export const useShootAutoStart = ({
  autoStart,
  contentPool,
  startGame,
  status,
}) => {
  const startGameRef = useRef(null);
  const lastContentKeyRef = useRef(null);

  useEffect(() => {
    startGameRef.current = startGame;
  });

  useEffect(() => {
    if (contentPool == null && !autoStart) return undefined;
    const key = getShootContentKey(contentPool);
    if (key !== lastContentKeyRef.current) {
      lastContentKeyRef.current = key;
      const timer = setTimeout(() => startGameRef.current?.(), 0);
      return () => clearTimeout(timer);
    }
    if (status === 'loading') {
      const timer = setTimeout(() => startGameRef.current?.(), 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [contentPool, autoStart, status]);
};
