import { getReferralPrice } from '../premiumPacks.js';
import { useLang } from '../../../hooks/useLang.js';

const PremiumPackList = ({ activeReferralOffer, packs, selected, onSelect }) => {
    const { t } = useLang();
    return (
    <div className="px-5 flex flex-col gap-3 mb-5">
        {packs.map(pack => {
            const isSelected = selected === pack.id;
            const referralPrice = getReferralPrice(pack, activeReferralOffer, t);

            return (
                <button
                    key={pack.id}
                    onClick={() => onSelect(pack.id)}
                    className={`premium-pack-option w-full flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all active:scale-[0.98] text-left relative ${isSelected ? 'is-selected' : ''}`}
                    style={{
                        background: isSelected ? pack.bg : '#F8F9FA',
                        border: isSelected ? `2px solid ${pack.color}` : '2px solid transparent',
                    }}
                >
                    <div
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{ borderColor: isSelected ? pack.color : '#CBD5E1' }}
                    >
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full" style={{ background: pack.color }} />}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-normal text-[16px] text-slate-800 dark:text-slate-100">{t(pack.title)}</span>
                            <span className="text-base font-normal" style={{ color: pack.color }}>{t(pack.subtitle)}</span>
                            {pack.badge && (
                                <span className="text-base font-normal text-white px-2 py-0.5 rounded-full" style={{ background: pack.color }}>
                                    {pack.badge}
                                </span>
                            )}
                        </div>
                        <div className="text-base text-slate-400 dark:text-slate-300 font-normal mt-0.5 break-keep">
                            {t(pack.desc)}
                        </div>
                    </div>

                    <div className="text-right shrink-0">
                        {referralPrice ? (
                            <>
                                <div className="text-base font-normal text-slate-400 line-through">{referralPrice.original}</div>
                                <div className="text-[16px] font-normal" style={{ color: pack.color }}>{referralPrice.discounted}</div>
                            </>
                        ) : (
                            <div className="text-[16px] font-normal" style={{ color: pack.color }}>
                                {pack.price}
                            </div>
                        )}
                    </div>
                </button>
            );
        })}
    </div>
    );
};

export default PremiumPackList;
