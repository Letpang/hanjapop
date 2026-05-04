import React, { createContext, useState, useContext, useMemo } from 'react';
import { strings } from './i18n/strings.js';

const LangContext = createContext();

export const LangProvider = ({ children }) => {
    const [lang, setLang] = useState(() => {
        const saved = localStorage.getItem('hanja_lang');
        return saved || (navigator.language.startsWith('ko') ? 'ko' : 'en');
    });

    const t = useMemo(() => (key) => {
        return strings[lang][key] || strings['en'][key] || key;
    }, [lang]);

    const value = {
        lang,
        setLang: (l) => {
            setLang(l);
            localStorage.setItem('hanja_lang', l);
        },
        t
    };

    return (
        <LangContext.Provider value={value}>
            {children}
        </LangContext.Provider>
    );
};

export const useLang = () => {
    const context = useContext(LangContext);
    if (!context) {
        throw new Error('useLang must be used within a LangProvider');
    }
    return context;
};
