import { STROKE_COLORS, STROKE_WIDTHS } from '../writingConstants.js';
import { useLang } from '../../../../hooks/useLang.js';

const WritingToolbar = ({ strokeColor, strokeWidth, onColorChange, onWidthChange }) => {
  const { t } = useLang();

  return (
    <div className="writing-toolbar w-full rounded-[2rem] px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-center gap-4 sm:gap-6" style={{ backgroundColor: '#F0F2F5' }}>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {STROKE_COLORS.map(c => (
          <button key={c.value} onClick={() => onColorChange(c.value)}
            aria-label={t('ext_1960', { label: t(c.label) })}
            className={`w-[22px] h-[22px] sm:w-6 sm:h-6 rounded-full transition-all active:scale-90 active:translate-y-[2px] shrink-0 ${strokeColor === c.value ? 'scale-110 ring-[3px] ring-white ring-offset-1 shadow-lg opacity-100' : 'opacity-45 hover:opacity-75'}`}
            style={{ backgroundColor: c.value, borderBottom: `3px solid ${c.dark}` }} />
        ))}
      </div>
      <div className="w-px h-8 rounded-full" style={{ backgroundColor: '#D8DCE3' }} />
      <div className="flex items-center gap-1.5 sm:gap-2">
        {STROKE_WIDTHS.map(w => (
          <button
            key={w.value}
            onClick={() => onWidthChange(w.value)}
            aria-label={t('ext_1961', { label: t(w.label) })}
            className={`w-9 h-8 sm:w-11 sm:h-9 rounded-full flex items-center justify-center transition-all active:scale-90 active:translate-y-[2px] shrink-0 ${
              strokeWidth === w.value
                ? 'bg-[#7C83FF] shadow-lg ring-[3px] ring-white ring-offset-1'
                : 'bg-[var(--color-bg-surface)] opacity-75 hover:opacity-100 shadow-sm'
            }`}
            style={{ borderBottom: strokeWidth === w.value ? '4px solid #5A61D4' : '4px solid #D0D5E0' }}
          >
            <span
              className="block w-[18px] sm:w-[22px] rounded-full"
              style={{
                height: w.value === 12 ? '3px' : w.value === 22 ? '6px' : '9px',
                backgroundColor: strokeWidth === w.value ? 'white' : '#AEB7C5',
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default WritingToolbar;