import AccountSection from './settings/components/AccountSection.jsx';
import DataSection from './settings/components/DataSection.jsx';
import DisplaySection from './settings/components/DisplaySection.jsx';
import LanguageSection from './settings/components/LanguageSection.jsx';
import ProfileSection from './settings/components/ProfileSection.jsx';
import ResetConfirmModal from './settings/components/ResetConfirmModal.jsx';
import SettingsHeader from './settings/components/SettingsHeader.jsx';
import useSettingsActions from './settings/hooks/useSettingsActions.js';

const SettingsScreen = ({
  onBack,
  isDarkMode,
  setIsDarkMode,
  userNickname,
  setUserNickname,
  selectedCharacter,
  setSelectedCharacter,
  restoreFromCloud,
  isRestoring,
  user,
  onLogout,
  onLogin,
  onResetPack,
  onActivateTestPack,
}) => {
  const actions = useSettingsActions({
    userNickname,
    setUserNickname,
    restoreFromCloud,
    onLogout,
    onResetPack,
    onActivateTestPack,
  });

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#FDFBF7] dark:bg-slate-950">
      <SettingsHeader onBack={onBack} />

      <div className="safe-bottom mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6 md:max-w-2xl md:px-6">
        <LanguageSection />
        <DisplaySection isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

        <ProfileSection
          tempNickname={actions.tempNickname}
          setTempNickname={actions.setTempNickname}
          onSaveNickname={actions.handleSaveNickname}
          selectedCharacter={selectedCharacter}
          setSelectedCharacter={setSelectedCharacter}
        />

        <AccountSection
          user={user}
          onLogout={actions.handleLogout}
          onLogin={onLogin}
          isLoggingOut={actions.isLoggingOut}
          logoutMessage={actions.logoutMessage}
        />

        <DataSection
          restoreFromCloud={restoreFromCloud}
          isRestoring={isRestoring}
          restoreMsg={actions.restoreMsg}
          onRestore={actions.handleRestore}
          onActivateTestPack={onActivateTestPack ? actions.handleActivateTestPack : null}
          packActivated={actions.packActivated}
          onResetPack={onResetPack ? actions.handleResetPack : null}
          packResetDone={actions.packResetDone}
          onShowResetConfirm={() => actions.setShowResetConfirm(true)}
        />

        <p className="pt-2 text-center text-xs font-normal text-slate-300 dark:text-slate-700">Hanja Pop v1.0.0</p>
      </div>

      <ResetConfirmModal
        isOpen={actions.showResetConfirm}
        onCancel={() => actions.setShowResetConfirm(false)}
      />
    </div>
  );
};

export default SettingsScreen;
