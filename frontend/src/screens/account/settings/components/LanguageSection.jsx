import { Section, Row } from './SettingsPrimitives.jsx';
import { useLang } from '../../../../hooks/useLang.js';
import { SUPPORTED_LANGS } from '../../../../LangContext.jsx';

const LANG_META = {
    ko:      { flag: '🇰🇷', name: '한국어' },
    en:      { flag: '🇺🇸', name: 'English' },
    ja:      { flag: '🇯🇵', name: '日本語' },
    'zh-CN': { flag: '🇨🇳', name: '简体中文' },
    'zh-TW': { flag: '🇹🇼', name: '繁體中文' },
    es:      { flag: '🇪🇸', name: 'Español' },
    fr:      { flag: '🇫🇷', name: 'Français' },
    de:      { flag: '🇩🇪', name: 'Deutsch' },
    pt:      { flag: '🇧🇷', name: 'Português' },
    ru:      { flag: '🇷🇺', name: 'Русский' },
    vi:      { flag: '🇻🇳', name: 'Tiếng Việt' },
    th:      { flag: '🇹🇭', name: 'ภาษาไทย' },
    id:      { flag: '🇮🇩', name: 'Bahasa Indonesia' },
    ar:      { flag: '🇸🇦', name: 'العربية' },
    it:      { flag: '🇮🇹', name: 'Italiano' },
    tr:      { flag: '🇹🇷', name: 'Türkçe' },
    hi:      { flag: '🇮🇳', name: 'हिन्दी' },
    ms:      { flag: '🇲🇾', name: 'Bahasa Melayu' },
    pl:      { flag: '🇵🇱', name: 'Polski' },
    nl:      { flag: '🇳🇱', name: 'Nederlands' },
};

const LanguageSection = () => {
    const { lang, setLang, t } = useLang();
    const current = LANG_META[lang] ?? LANG_META['en'];

    return (
        <Section title={t('ext_3237')} color="#7C6DC0">
            <Row label={`${current.flag} ${current.name}`}>
                <select
                    value={lang}
                    onChange={e => setLang(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-normal text-slate-700 shadow-sm outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                    style={{ direction: 'ltr' }}
                >
                    {SUPPORTED_LANGS.map(code => {
                        const meta = LANG_META[code];
                        return (
                            <option key={code} value={code}>
                                {meta.flag} {meta.name}
                            </option>
                        );
                    })}
                </select>
            </Row>
        </Section>
    );
};

export default LanguageSection;
