import { useLang } from '../../../../hooks/useLang.js';

const CharacterNicknameForm = ({
    canConfirm,
    confirmText,
    nickname,
    nicknameRef,
    onChange,
    onConfirm,
    onKeyDown,
    showInput,
}) => {
    const { t } = useLang();

    return (
        <div
            className={`w-full max-w-md flex flex-col items-center gap-2.5 mt-1 transition-all duration-700 ease-out ${
                showInput ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
            }`}
        >
            <div className="w-full relative group">
                <input
                    ref={nicknameRef}
                    type="text"
                    value={nickname}
                    onChange={(e) => onChange(e.target.value.slice(0, 10))}
                    onKeyDown={onKeyDown}
                    placeholder={t('ext_2047')}
                    maxLength={10}
                    className="w-full rounded-full glass-panel !bg-[var(--color-bg-surface)]/80 text-slate-800 font-medium text-center text-base md:text-lg px-6 py-3.5 focus:outline-none focus:ring-4 focus:ring-white/50 transition-all placeholder:text-slate-400 placeholder:font-normal"
                />
            </div>

            {canConfirm && (
                <button
                    onClick={onConfirm}
                    className="w-full py-4 rounded-[2rem] bg-[#7C83FF] text-white font-normal text-lg transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95"
                >
                    {confirmText}
                </button>
            )}
        </div>
    );
};

export default CharacterNicknameForm;