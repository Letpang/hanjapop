import { PremiumProvider } from '../context/PremiumContext.jsx';
import AppContentFlow from './components/AppContentFlow.jsx';
import AppOverlays from './components/AppOverlays.jsx';
import UpdateRequiredModal from './components/UpdateRequiredModal.jsx';
import { useAppController } from './hooks/useAppController.js';

const App = () => {
  const {
    contentFlowProps,
    currentLevel,
    currentScreen,
    isDarkMode,
    onShowPremium,
    overlayProps,
    unlockedPack,
    versionInfo,
  } = useAppController();

  return (
    <PremiumProvider unlockedPack={unlockedPack} onShowPremium={onShowPremium}>
        <div
          className={`app-container premium-aurora-bg diamond-overlay ${isDarkMode ? 'dark-mode' : ''} transition-colors duration-500 min-h-screen`}
          data-level={currentLevel}
        >
          <div className="space-bg"></div>
          <div className="stars-overlay"></div>

          {versionInfo.needsUpdate && (
            <UpdateRequiredModal
              latestVersion={versionInfo.latestVersion}
              storeUrl={versionInfo.storeUrl}
            />
          )}

          <div className={`content-area relative z-10 ${currentScreen === 'matchGame' ? 'content-area--match-game' : ''}`}>
            <AppContentFlow {...contentFlowProps} />
          </div>

          <AppOverlays {...overlayProps} />
        </div>
    </PremiumProvider>
  );
};

export default App;
