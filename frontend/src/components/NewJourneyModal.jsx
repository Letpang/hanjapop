import ResultModalShell, {
    ResultModalActions,
    ResultModalHeading,
    ResultPrimaryButton,
    ResultSecondaryButton,
} from './common/ResultModalShell.jsx';
import { useLang } from '../hooks/useLang.js';

const NewJourneyModal = ({ nextRound = 2, onBrowseMemory, onStart, onClose }) => {
    const { t } = useLang();

    return (
        <ResultModalShell onBackdropClick={onClose} labelledBy="new-journey-title">
            <div className="flex flex-col items-center gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-[1.65rem] bg-gradient-to-br from-[#FFF4D8] to-[#FFE1B8] text-4xl shadow-inner">
                    🧭
                </div>
                <ResultModalHeading
                    id="new-journey-title"
                    kicker={t('ext_1840')}
                    title={t('ext_2259', { nextRound })}
                    description={<> {t('ext_1965')}<br />{t('ext_2492')}</>}
                />

                <div className="grid w-full grid-cols-2 gap-2.5 rounded-[1.5rem] bg-slate-50 p-3 text-center shadow-inner">
                    <div className="rounded-[1.15rem] bg-white px-2 py-3.5 shadow-sm">
                        <strong className="block text-base font-medium text-[#2AAFA2]">{t('ext_1612')}</strong>
                        <span className="mt-1.5 block text-base leading-snug text-slate-500">{t('ext_3199')}<br />{t('ext_1966')}</span>
                    </div>
                    <div className="rounded-[1.15rem] bg-white px-2 py-3.5 shadow-sm">
                        <strong className="block text-base font-medium text-[#7C83FF]">{t('ext_1613')}</strong>
                        <span className="mt-1.5 block text-base leading-snug text-slate-500">{t('ext_2290', { nextRound })}<br />{t('ext_1790')}</span>
                    </div>
                </div>

                <ResultModalActions>
                    <ResultPrimaryButton onClick={onStart}>{t('ext_1690')}</ResultPrimaryButton>
                    <ResultSecondaryButton onClick={onBrowseMemory}>{t('ext_1841')}</ResultSecondaryButton>
                    <button type="button" onClick={onClose} className="py-1 text-base text-slate-400">
                        {t('ext_2697')}
                    </button>
                </ResultModalActions>
            </div>
        </ResultModalShell>
    );
};

export default NewJourneyModal;