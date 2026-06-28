import { useLang } from '../../../../hooks/useLang.js';

const JourneyMonsterHint = ({ isDailyComplete, currentDay }) => {
  const { t } = useLang();

  return (
    <>
      <img
        src={isDailyComplete ? '/assets/images/icons/monster_remove.webp' : '/assets/images/icons/monster_new_new.webp'}
        alt="monster"
        className={`absolute pointer-events-none object-contain ${isDailyComplete ? 'z-30' : 'z-0'}`}
        style={{
          width: isDailyComplete ? 112 : 84,
          height: isDailyComplete ? 112 : 84,
          right: isDailyComplete ? 40 : 16,
          top: isDailyComplete ? -48 : -33,
          filter: isDailyComplete ? 'none' : 'drop-shadow(0 -8px 16px rgba(16,185,129,0.35))',
          animation: 'mm-float 4s ease-in-out infinite',
        }}
        onError={(event) => {
          event.target.style.display = 'none';
        }}
      />

      {isDailyComplete && (
        <div
          className="absolute z-30 rounded-[1.25rem] bg-white px-3.5 py-2.5 border border-[#FFE0D4] shadow-lg"
          style={{
            right: 150,
            top: -34,
            maxWidth: 190,
            boxShadow: '0 10px 22px rgba(255, 107, 107, 0.16), 0 4px 10px rgba(15, 23, 42, 0.04)',
          }}
        >
          <p className="text-base font-normal leading-snug text-[#FF6B6B] break-keep relative z-10">
            {t('ext_2785', { currentDay })}
          </p>
          <svg className="absolute top-1/2 -translate-y-1/2 w-[9px] h-[16px]" style={{ right: '-8px' }} viewBox="0 0 9 16" fill="none">
            <path d="M-1 1 L7 8 L-1 15" fill="white" stroke="#FFE0D4" strokeWidth="1" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </>
  );
};

export default JourneyMonsterHint;
