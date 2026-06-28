import { useState, useEffect, useMemo } from 'react';
import { strings } from './i18n/strings.js';
import { SK } from './constants/storageKeys.js';
import { LangContext } from './context/langContextValue.js';
import koExtracted from './i18n/extracted_ko.json';
import enExtracted from './i18n/extracted_en.json';

export const SUPPORTED_LANGS = [
    'ko', 'en', 'ja', 'zh-CN', 'zh-TW', 'es', 'fr', 'de', 'pt',
    'ru', 'vi', 'th', 'id', 'ar', 'it', 'tr', 'hi', 'ms', 'pl', 'nl',
];

const RTL_LANGS = new Set(['ar']);

// ko/en은 번들에 포함, 나머지는 동적 로드
const PRELOADED = { ko: koExtracted, en: enExtracted };

const cleanVal = (v) => (typeof v === 'string' ? v.replace(/^[\s}>/]+/, '').trim() : v);

function detectLang() {
    const nav = navigator.language || 'en';
    if (nav.startsWith('ko')) return 'ko';
    if (nav.startsWith('ja')) return 'ja';
    if (nav.startsWith('zh-TW') || nav === 'zh-Hant') return 'zh-TW';
    if (nav.startsWith('zh')) return 'zh-CN';
    if (nav.startsWith('es')) return 'es';
    if (nav.startsWith('fr')) return 'fr';
    if (nav.startsWith('de')) return 'de';
    if (nav.startsWith('pt')) return 'pt';
    if (nav.startsWith('ru')) return 'ru';
    if (nav.startsWith('vi')) return 'vi';
    if (nav.startsWith('th')) return 'th';
    if (nav.startsWith('id')) return 'id';
    if (nav.startsWith('ar')) return 'ar';
    if (nav.startsWith('it')) return 'it';
    if (nav.startsWith('tr')) return 'tr';
    if (nav.startsWith('hi')) return 'hi';
    if (nav.startsWith('ms')) return 'ms';
    if (nav.startsWith('pl')) return 'pl';
    if (nav.startsWith('nl')) return 'nl';
    return 'en';
}

function getInitialLang() {
    const saved = localStorage.getItem(SK.HANJA_LANG);
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
    return detectLang();
}

export const LangProvider = ({ children }) => {
    const [lang, setLangState] = useState(getInitialLang);
    const [extractedData, setExtractedData] = useState(() => PRELOADED[getInitialLang()] ?? enExtracted);

    useEffect(() => {
        if (PRELOADED[lang]) {
            setExtractedData(PRELOADED[lang]);
            return;
        }
        import(`./i18n/extracted_${lang}.json`)
            .then(m => setExtractedData(m.default))
            .catch(() => setExtractedData(enExtracted));
    }, [lang]);

    useEffect(() => {
        document.documentElement.dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr';
    }, [lang]);

    const t = useMemo(() => (key, params) => {
        const raw = extractedData[key]
            ?? strings[lang]?.[key]
            ?? enExtracted[key]
            ?? strings['en']?.[key]
            ?? key;
        const str = cleanVal(raw);
        if (!params) return str;
        return str.replace(/\{([^}]+)\}/g, (_, k) => params[k] ?? `{${k}}`);
    }, [extractedData, lang]);

    const setLang = (l) => {
        setLangState(l);
        localStorage.setItem(SK.HANJA_LANG, l);
    };

    return (
        <LangContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LangContext.Provider>
    );
};
