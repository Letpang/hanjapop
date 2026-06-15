import { createContext } from 'react';

export const PremiumContext = createContext({
    unlockedPack: 0,
    isPremium: false,
    canAccessStage: (stage) => stage <= 17,
    showPremiumGate: () => {},
});
