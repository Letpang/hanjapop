import { PremiumContext } from './premiumContextValue.js';
import { canAccessStage } from '../utils/premiumAccess.js';

export const PremiumProvider = ({ children, unlockedPack = 0, onShowPremium }) => (
    <PremiumContext.Provider value={{
        unlockedPack,
        isPremium: unlockedPack > 0,
        canAccessStage: (stage) => canAccessStage(unlockedPack, stage),
        showPremiumGate: onShowPremium,
    }}>
        {children}
    </PremiumContext.Provider>
);
