import { useContext } from 'react';
import { PremiumContext } from '../context/premiumContextValue.js';

export const usePremium = () => useContext(PremiumContext);
