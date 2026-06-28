import { GRADE_TEST_SCREENS } from '../../appConstants.js';
import { MyPageScreen, SettingsScreen, VocabularyScreen } from '../../appScreens.js';
import { useLang } from '../../../hooks/useLang.js';

const AccountRoutes = ({
    authSignOut,
    currentScreen,
    finalJourney,
    isDarkMode,
    isRestoring,
    restoreFromCloud,
    selectedCharacter,
    setCurrentScreen,
    setGradeTestBackScreen,
    setIsDarkMode,
    setSelectedCharacter,
    setShowLoginModal,
    setUnlockedPack,
    setUserNickname,
    streak,
    totalStats,
    user,
    userNickname,
    userXp,
}) => {
    const { t } = useLang();
    if (currentScreen === 'settings') {
        return <SettingsScreen
            onBack={() => setCurrentScreen('mypage')}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            userNickname={userNickname}
            setUserNickname={setUserNickname}
            selectedCharacter={selectedCharacter}
            setSelectedCharacter={setSelectedCharacter}
            restoreFromCloud={restoreFromCloud}
            isRestoring={isRestoring}
            user={user}
            onLogin={() => setShowLoginModal(true)}
            onLogout={async () => {
                await authSignOut();
                setUnlockedPack(0);
                localStorage.setItem('unlocked_pack', '0');
                setCurrentScreen('main');
                return { success: true };
            }}
        />;
    }

    if (currentScreen === 'mypage') {
        return <MyPageScreen
            onBack={() => setCurrentScreen('main')}
            onNavigate={(screen) => {
                if (GRADE_TEST_SCREENS.includes(screen)) setGradeTestBackScreen('mypage');
                setCurrentScreen(screen);
            }}
            userXp={userXp}
            userNickname={userNickname}
            selectedCharacter={selectedCharacter}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            streak={streak}
            totalStats={totalStats}
            finalJourney={finalJourney}
        />;
    }

    if (currentScreen === 'vocabulary') {
        return <VocabularyScreen
            key="vocabulary"
            onBack={() => setCurrentScreen('mypage')}
            isDarkMode={isDarkMode}
        />;
    }

    if (currentScreen !== 'wrongVocabulary') return null;

    return <VocabularyScreen
        key="wrong-vocabulary"
        onBack={() => setCurrentScreen('main')}
        isDarkMode={isDarkMode}
        initialFilter="wrong"
        title={t('ext_1545')}
        subtitle={t('ext_2221')}
    />;
};

export default AccountRoutes;
