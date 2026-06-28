import { useEffect } from 'react';

export const useShootHpGuard = ({ hp, setStatus, status }) => {
  useEffect(() => {
    if (hp > 0 || status !== 'playing') return undefined;

    const timer = setTimeout(() => {
      setStatus('over');
    }, 0);

    return () => clearTimeout(timer);
  }, [hp, setStatus, status]);
};
