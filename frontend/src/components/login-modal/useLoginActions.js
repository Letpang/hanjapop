import { useState } from 'react';
import { useLang } from '../../hooks/useLang.js';

export const useLoginActions = ({ onClose, signInWithApple, signInWithGoogle, signInWithKakao }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { t } = useLang();

  const runLogin = async (signIn, errorMessage) => {
    setLoading(true);
    setError(null);
    const result = await signIn?.();
    setLoading(false);

    if (result?.success) {
      onClose?.();
      return;
    }
    setError(errorMessage);
  };

  return {
    error,
    loading,
    handleApple: () => runLogin(signInWithApple, t('ext_2522')),
    handleGoogle: () => runLogin(signInWithGoogle, t('ext_2523')),
    handleKakao: () => runLogin(signInWithKakao, t('ext_2561')),
  };
};
