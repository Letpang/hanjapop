import { useLang } from '../../../hooks/useLang.js';

const MainHeader = ({ streak, onNavigate }) => {
    const { t } = useLang();

    return (
        <header
            className="shrink-0 w-full flex items-center justify-between px-6 relative z-30"
            style={{
                paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)',
                paddingBottom: '0.5rem',
            }}
        >
            <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #2ED6C5 0%, #0D9488 100%)' }}>
                    <span className="main-header-logo-letter">H</span>
                </div>
                <span className="main-header-brand-name">
                    HanjaPop
                </span>
            </div>
            <div className="flex items-center gap-2">
                {streak?.count > 0 && (
                    <button
                        type="button"
                        onClick={() => onNavigate('calendar')}
                        className="flex items-center gap-1 bg-[#FFF0EB] px-2 py-1 rounded-full border border-[#FFE4D6] shadow-sm active:scale-95 transition-transform"
                        aria-label={t('ext_2602', { count: streak.count })}
                    >
                        <span className="text-sm">🔥</span>
                        <span className="font-normal text-[#FF9B73] text-base">{streak.count}{t('ext_1')}</span>
                    </button>
                )}
                <button
                    onClick={() => onNavigate('settings')}
                    className="h-8 w-8 rounded-full border border-[#D7F3EF] bg-white/90 shadow-sm flex items-center justify-center active:scale-95 transition-transform"
                    aria-label={t('ext_1486')}
                    title={t('ext_908')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                        className="w-4 h-4 text-[#AEB7C5]">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1-1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                </button>
            </div>
        </header>
    );
};

export default MainHeader;
