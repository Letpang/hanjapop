function getLengthClass(text) {
    if (text.length > 12) return 'shoot-option-text--xlong';
    if (text.length > 6) return 'shoot-option-text--long';
    return '';
}

export default function ShootOptionsGrid({ isInputLocked, isWordTarget, onOptionClick, options }) {
    return (
        <div
            className="quiz-numbered-grid shrink-0 px-4 grid grid-cols-2 gap-2 z-40"
            style={{ paddingTop: '6px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)' }}
        >
            {options.map((option, index) => {
                const parts = option.split(' ');
                const sound = parts.pop();
                const meaning = parts.join(' ');
                const lenClass = getLengthClass(meaning);

                return (
                    <button
                        key={`${option}-${index}`}
                        onClick={() => onOptionClick(option)}
                        className={`shoot-option-button bg-white/22 px-3 py-0.5 rounded-[1rem] font-normal border border-[rgba(78,112,122,0.24)] shadow-[0_6px_14px_rgba(45,88,96,0.10)] backdrop-blur-sm active:scale-95 transition-all text-center break-keep flex items-center justify-center gap-1.5 ${isInputLocked ? 'opacity-50 grayscale' : 'opacity-90 hover:opacity-100'}`}
                    >
                        {isWordTarget ? (
                            <span className={`shoot-option-text ${lenClass} text-slate-700 dark:text-slate-100`}>{meaning}</span>
                        ) : (
                            <>
                                <span className={`shoot-option-text ${lenClass} text-slate-700 dark:text-slate-100`}>{meaning}</span>
                                <span className="shoot-option-text text-[#7C83FF]">{sound}</span>
                            </>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
