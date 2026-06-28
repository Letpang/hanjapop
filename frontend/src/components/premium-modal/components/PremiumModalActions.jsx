import { useLang } from '../../../hooks/useLang.js';

const PremiumModalActions = ({
    disabled,
    errorMsg,
    isNative,
    onBuy,
    onClose,
    onRestore,
    onShowLogin,
    purchaseLabel,
}) => {
    const { t } = useLang();

    return (
        <>
            {errorMsg && (
                <p className="px-6 mb-3 text-center text-base text-red-500 font-normal break-keep">
                    {errorMsg}
                </p>
            )}

            <div className="px-6">
                <button
                    onClick={onBuy}
                    disabled={disabled}
                    className="w-full py-4 rounded-full font-normal text-white text-[17px] shadow-[0_8px_20px_rgba(46,214,197,0.25)] transition-transform active:scale-[0.98] disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #2ED6C5, #0D9488)' }}
                >
                    {purchaseLabel}
                </button>

                {isNative ? (
                    <button
                        onClick={onRestore}
                        disabled={disabled}
                        className="w-full py-3 mt-1 text-base text-gray-400 font-normal disabled:opacity-60"
                    >
                        {t('ext_2762')}
                    </button>
                ) : (
                    <button
                        onClick={onShowLogin}
                        className="w-full py-3 mt-1 text-base text-gray-400 font-normal"
                    >
                        {t('ext_2772')}
                    </button>
                )}

                <button
                    onClick={onClose}
                    className="w-full py-2 text-base text-gray-300 font-normal"
                >
                    {t('ext_2465')}
                </button>
            </div>
        </>
    );
};

export default PremiumModalActions;
