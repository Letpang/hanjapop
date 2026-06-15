import { useState, useMemo } from 'react';
import { strings } from './i18n/strings.js';
import { SK } from './constants/storageKeys.js';
import { LangContext } from './context/langContextValue.js';

export const LangProvider = ({ children }) => {
    const [lang, setLang] = useState(() => {
        const saved = localStorage.getItem(SK.HANJA_LANG);
        return saved || (navigator.language.startsWith('ko') ? 'ko' : 'en');
    });

    const t = useMemo(() => (key) => {
        return strings[lang][key] || strings['en'][key] || key;
    }, [lang]);

    const value = {
        lang,
        setLang: (l) => {
            setLang(l);
            localStorage.setItem(SK.HANJA_LANG, l);
        },
        t
    };

    return (
        <LangContext.Provider value={value}>
            {children}
        </LangContext.Provider>
    );
};
