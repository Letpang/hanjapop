import { useLang } from '../../../../hooks/useLang.js';

const CharacterSelectionIntro = ({ selectedChar }) => {
    const { t } = useLang();

    return (
        <div className="text-center mt-0 mb-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-[clamp(1.55rem,5.5vw,2.2rem)] font-medium text-slate-800 tracking-normal text-balance leading-[1.2]">
                {t('ext_2451')}<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C83FF] to-[#FF8D72]">{t('ext_1659')}</span>{t('ext_1660')}
            </h1>
            <p className="mt-2 text-slate-500 text-base md:text-lg leading-snug">
                {selectedChar ? t(selectedChar.desc) : t('ext_2276')}
            </p>
        </div>
    );
};

export default CharacterSelectionIntro;