import { useLang } from '../../../../hooks/useLang.js';

const ShootLoadingScreen = ({ themeConfig }) => {
    const { t } = useLang();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center  px-8">
            <div className="flex flex-col items-center gap-4 text-center">
                <div
                    className="h-16 w-16 rounded-[1.4rem] border-4 border-[var(--color-border-subtle)] shadow-lg animate-pulse"
                    style={{ backgroundColor: themeConfig.accentColor }}
                />
                <p className="text-body-lg font-normal text-[color:var(--color-text-muted)] dark:text-slate-300 break-keep">{t('ext_2054')}</p>
            </div>
        </div>
    );
};

export default ShootLoadingScreen;