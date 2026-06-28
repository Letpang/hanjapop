import { getCharacterScale } from '../../../../utils/rankUtils.js';
import { useLang } from '../../../../hooks/useLang.js';

const CharacterOptionCard = ({ char, index, isSelected, onSelect }) => {
  const { t } = useLang();
  return (
    <button
        onClick={() => onSelect(char.id)}
        className={`character-selection-card group relative flex flex-col items-center justify-between rounded-[2rem] overflow-hidden transition-all duration-500 focus:outline-none h-[clamp(195px,48vw,260px)] md:h-[clamp(280px,38vw,340px)] lg:h-[clamp(240px,26vh,300px)] ${
            isSelected
                ? 'glass-panel scale-[1.03] z-10'
                : 'glass-panel hover:-translate-y-2 hover:bg-[var(--color-bg-surface)]/70 opacity-90 hover:opacity-100'
        }`}
        style={{
            borderColor: isSelected ? char.color : 'rgba(255,255,255,0.9)',
            boxShadow: isSelected ? `0 12px 40px ${char.glow}, inset 0 2px 0 rgba(255,255,255,1)` : '',
        }}
    >
        {isSelected && (
            <div
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white text-base z-20 shadow-lg animate-in zoom-in duration-300"
                style={{ backgroundColor: char.color }}
            >
                ✓
            </div>
        )}

        <div className="relative flex-1 w-full flex items-center justify-center mt-2">
            <div
                className={`transition-transform duration-700 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}
                style={{ transform: `translateY(${char.cardTranslateY ?? '0px'}) scale(${char.cardScale ?? getCharacterScale(char.id, 'rank5')})` }}
            >
                <img
                    src={char.finalImage}
                    alt={t(char.name)}
                    className={`max-h-[140px] md:max-h-[190px] lg:max-h-[175px] w-auto object-contain drop-shadow-xl ${
                        isSelected ? 'animate-float' : 'animate-float-delay'
                    }`}
                    style={{ animationDelay: `${index * 0.2}s` }}
                />
            </div>
        </div>

        <div className="w-full flex flex-col items-center gap-1.5 pb-3 pt-1 shrink-0">
            <span className={`font-medium text-[clamp(16px,4.2vw,20px)] tracking-normal transition-colors duration-300 ${isSelected ? 'text-slate-800' : 'text-slate-600'}`}>
                {t(char.name)}
            </span>
            <div
                className={`h-1.5 rounded-full transition-all duration-500 ${isSelected ? 'w-16' : 'w-8'}`}
                style={{ backgroundColor: char.color }}
            />
        </div>
    </button>
  );
};

export default CharacterOptionCard;
