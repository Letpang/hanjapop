import { useState, useEffect, useRef } from 'react';
import MainMenu from './components/MainMenu.jsx';
import FlashcardScreen from './components/FlashcardScreen.jsx';
import MatchGameScreen from './components/MatchGameScreen.jsx';
import ShootGameScreen from './components/ShootGameScreen.jsx';
import WritingScreen from './components/WritingScreen.jsx';
import StickerBookScreen from './components/StickerBookScreen.jsx';
import BackgroundMusic from './components/BackgroundMusic.jsx';
import { useAdMob } from './hooks/useAdMob.js';
import { useVersionCheck } from './hooks/useVersionCheck.js';
import AppUpdateModal from './components/AppUpdateModal.jsx';
import PremiumModal from './components/PremiumModal.jsx';

const App = () => {
    const [currentScreen, setCurrentScreen] = useState('menu');
    const [showUpsell, setShowUpsell] = useState(false);
    const { showInterstitial } = useAdMob({ onAfterInterstitial: () => setShowUpsell(true) });
    const updateInfo = useVersionCheck();
    const wakeLockRef = useRef(null);

    const [unlockedStickers, setUnlockedStickers] = useState(() => {
        try {
            const saved = window.localStorage.getItem('hanja_stickers_save');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error("스티커 불러오기 실패:", error);
            return {};
        }
    });

    const [unlockedStages, setUnlockedStages] = useState(() => {
        try {
            const saved = window.localStorage.getItem('hanja_stages_save');
            return saved ? JSON.parse(saved) : [1];
        } catch (error) {
            return [1];
        }
    });

    useEffect(() => {
        window.localStorage.setItem('hanja_stickers_save', JSON.stringify(unlockedStickers));
    }, [unlockedStickers]);

    useEffect(() => {
        window.localStorage.setItem('hanja_stages_save', JSON.stringify(unlockedStages));
    }, [unlockedStages]);

    const handleHanjaAcquired = (id) => {
        setUnlockedStickers((prev) => {
            const currentCount = prev[id] || 0;
            return { ...prev, [id]: currentCount + 1 };
        });
    };

    const handleStageClear = (stage) => {
        setUnlockedStages((prev) => {
            const nextStage = stage + 1;
            if (nextStage <= 10 && !prev.includes(nextStage)) {
                return [...prev, nextStage].sort((a, b) => a - b);
            }
            return prev;
        });
    };
    // ── 광고: 화면 전환 시 전면 광고 제어 ──────────────
    useEffect(() => {
        if (currentScreen === 'menu') {
            showInterstitial();
            if (wakeLockRef.current) {
                wakeLockRef.current.release().catch(() => {});
                wakeLockRef.current = null;
            }
        } else {
            if ('wakeLock' in navigator) {
                navigator.wakeLock.request('screen')
                    .then(lock => { wakeLockRef.current = lock; })
                    .catch(() => {});
            }
        }
    }, [currentScreen]);

    // 메뉴 복귀 헬퍼 (전면 광고 트리거 포함)
    const goToMenu = () => setCurrentScreen('menu');

    return (
        <div className={"min-h-screen transition-colors duration-500 font-sans relative " + (currentScreen === 'menu' ? "pt-6 pb-40" : "")}>
            <div className="space-bg"></div>
            <div className="stars-overlay"></div>
            
            {/* 배경 음악 시스템 */}
            <BackgroundMusic currentScreen={currentScreen} />

            {/* 프리미엄 업셀 모달 (전면광고 종료 후) */}
            {showUpsell && (
                <PremiumModal
                    onClose={() => setShowUpsell(false)}
                    onPurchaseSuccess={() => setShowUpsell(false)}
                />
            )}

            {/* 강제 업데이트 모달 */}
            {updateInfo.needsUpdate && (
                <AppUpdateModal 
                    currentVersion={updateInfo.currentVersion}
                    latestVersion={updateInfo.latestVersion}
                    storeUrl={updateInfo.storeUrl}
                />
            )}

            {currentScreen === 'menu' && (
                <MainMenu
                    onNavigate={setCurrentScreen}
                    unlockedStickers={unlockedStickers}
                    unlockedStages={unlockedStages}
                />
            )}
            {currentScreen === 'matchGame' && (
                <MatchGameScreen
                    onBack={goToMenu}
                    onHanjaAcquired={handleHanjaAcquired}
                    onStageClear={handleStageClear}
                    unlockedStages={unlockedStages}
                />
            )}
            {currentScreen === 'flashcard' && (
                <FlashcardScreen
                    onBack={goToMenu}
                    unlockedStages={unlockedStages}
                    onStageClear={handleStageClear}
                />
            )}
            {currentScreen === 'shootGame' && (
                <ShootGameScreen
                    onBack={goToMenu}
                    onHanjaAcquired={handleHanjaAcquired}
                />
            )}
            {currentScreen === 'stickerBook' && (
                <StickerBookScreen
                    onBack={goToMenu}
                    unlockedStickers={unlockedStickers}
                />
            )}
            {currentScreen === 'writing' && (
                <WritingScreen onBack={goToMenu} />
            )}
        </div>
    );
};

export default App;
