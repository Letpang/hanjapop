import { useLang } from '../../../hooks/useLang.js';

const GameStartHero = ({
  borderColor = '#E0735A',
  bubbleText,
  characterAvatar,
  onStart,

}) => {
  const { t } = useLang();

  return (
    <>
      <div className="flex flex-col items-center mt-4 mb-5 relative">
        <div className="absolute top-4 left-[60%] z-20">
          <div className="quiz-bubble">
            <span className="text-body font-normal text-[color:var(--color-text-muted)] dark:text-slate-300 whitespace-nowrap break-keep">{bubbleText}</span>
            <div className="absolute -bottom-1.5 left-3 w-4 h-4 rotate-45 bg-[var(--color-bg-surface)] border-r border-b border-[var(--color-border-subtle)]" />
          </div>
        </div>
        <div className="relative z-10 w-36 h-36 flex items-center justify-center mt-10">
          <img src={characterAvatar} className="w-full h-full object-contain drop-shadow-2xl" alt="avatar" />
        </div>
        <div className="w-40 h-4 bg-slate-400/20 blur-lg rounded-[100%] scale-x-125 -mt-6" />
      </div>

      <div className="w-full max-w-sm px-4 pb-4 -mt-2.5">
        <button
          onClick={onStart}
          className="w-full py-5 rounded-[2rem] font-normal text-h3 text-white transition-all active:scale-95 shadow-xl shadow-[#FF9B73]/20/50 flex items-center justify-center gap-3 active:translate-y-1 active:shadow-none"
          style={{
            backgroundColor: '#FF9B73',
            borderBottom: `6px solid ${borderColor}`,
          }}
        >
          <span>{t('ext_1581')}</span>
        </button>
      </div>
    </>
  );
};

export default GameStartHero;
