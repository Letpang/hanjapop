import { useMemo } from 'react';
import { getToastMessage } from './characterToastMessages.js';
import { useLang } from '../../hooks/useLang.js';

export const useCharacterToastMessage = (type, nearRankUp) => {
  const { t } = useLang();
  const { message: key, isTypeB } = useMemo(() => getToastMessage(type, nearRankUp), [type, nearRankUp]);
  return { message: t(key), isTypeB };
};
