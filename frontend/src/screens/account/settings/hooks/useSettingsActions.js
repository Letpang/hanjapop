import { useState } from 'react';
import { SK } from '../../../../constants/storageKeys.js';
import { useLang } from '../../../../hooks/useLang.js';

const getRecoveredDays = (legacyRecovery) => (
  Math.max(
    0,
    Number(legacyRecovery?.study_days_after || 0) - Number(legacyRecovery?.study_days_before || 0),
  )
);

const useSettingsActions = ({
  userNickname,
  setUserNickname,
  restoreFromCloud,
  onLogout,
  onResetPack,
  onActivateTestPack,
}) => {
  const { t } = useLang();
  const [tempNickname, setTempNickname] = useState(userNickname || '');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState(null);
  const [packResetDone, setPackResetDone] = useState(false);
  const [packActivated, setPackActivated] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState('');

  const handleLogout = async () => {
    if (!onLogout || isLoggingOut) return;

    setIsLoggingOut(true);
    setLogoutMessage('');
    try {
      const result = await onLogout();
      if (result?.success === false) throw result.error || new Error('logout_failed');
    } catch {
      setLogoutMessage(t('ext_2703'));
      setIsLoggingOut(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreFromCloud) return;

    const { success, reason, legacyRecovery } = await restoreFromCloud();
    if (success) {
      const recoveredDays = getRecoveredDays(legacyRecovery);
      setRestoreMsg(recoveredDays > 0
        ? t('ext_3225', { recoveredDays })
        : t('ext_2679'));
      setTimeout(() => window.location.reload(), 1200);
      return;
    }

    if (reason === 'error') {
      setRestoreMsg(t('ext_2781'));
      setTimeout(() => setRestoreMsg(null), 5000);
      return;
    }

    if (reason === 'not_found') {
      setRestoreMsg(t('ext_2314'));
      setTimeout(() => setRestoreMsg(null), 4000);
    }
  };

  const handleSaveNickname = () => {
    if (!tempNickname.trim()) return;
    setUserNickname(tempNickname.trim());
    localStorage.setItem(SK.SETTINGS_NICKNAME, tempNickname.trim());
    alert(t('ext_1919'));
  };

  const handleActivateTestPack = async () => {
    await onActivateTestPack?.();
    setPackActivated(true);
    setTimeout(() => setPackActivated(false), 2500);
  };

  const handleResetPack = async () => {
    await onResetPack?.();
    setPackResetDone(true);
    setTimeout(() => setPackResetDone(false), 2500);
  };

  return {
    handleActivateTestPack,
    handleLogout,
    handleResetPack,
    handleRestore,
    handleSaveNickname,
    isLoggingOut,
    logoutMessage,
    packActivated,
    packResetDone,
    restoreMsg,
    setShowResetConfirm,
    setTempNickname,
    showResetConfirm,
    tempNickname,
  };
};

export default useSettingsActions;
