import { useLang } from '../../../hooks/useLang.js';

const MemoryVaultButton = ({ archivedCompletedDay, journeyRound, isJourneyComplete, onOpen, style }) => {
    const { t } = useLang();

    if (archivedCompletedDay <= 1 && journeyRound <= 1 && !isJourneyComplete) return null;

    return (
        <div className="w-full max-w-md" style={style}>
            <button
                onClick={onOpen}
                className="w-full relative overflow-hidden flex items-center gap-4 px-5 py-3 rounded-[1.5rem] active:scale-[0.98] transition-all bg-white/80 backdrop-blur-md"
            >
                <div className="shrink-0 w-12 h-12 rounded-[1rem] flex items-center justify-center bg-[#7C83FF]/10 border border-[#7C83FF]/20 shadow-inner">
                    <span className="text-2xl drop-shadow-sm">🔮</span>
                </div>
                <div className="flex-1 text-left min-w-0">
                    <div className="font-normal text-base text-[#4F56D9] tracking-normal">
                        {t('ext_2727')}
                    </div>
                    <div className="font-normal text-xs mt-0.5 text-[#8f99ad]">
                        {isJourneyComplete
                            ? t('ext_2413')
                            : t('ext_2933', { archivedCompletedDay: Math.max(1, archivedCompletedDay) })}
                    </div>
                </div>
                <div className="shrink-0 text-[#7C83FF]/50 font-normal">
                    ❯
                </div>
            </button>
        </div>
    );
};

export default MemoryVaultButton;
