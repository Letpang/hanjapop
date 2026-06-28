import { useLang } from '../../../hooks/useLang.js';

const PremiumModalHeader = () => {
    const { t } = useLang();
    
    return (
        <div className="px-6 pt-3 pb-4 text-center">
            <h2 className="text-2xl font-medium text-gray-800 tracking-normal">{t('ext_1692')}</h2>
            <p className="text-base font-normal text-slate-400 mt-1 break-keep">
                {t('ext_2828')}
            </p>
        </div>
    );
};

export default PremiumModalHeader;