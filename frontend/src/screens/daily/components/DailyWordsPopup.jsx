import IDIOMS from '../../../data/idioms.js';
import { localizeIdioms } from '../../../data/idiomI18nKeys.js';
import { speakKorean } from '../../../utils/speakUtils.js';
import { useLang } from '../../../hooks/useLang.js';

const DailyWordsPopup = ({ item, onClose }) => {
  const { t } = useLang();
  const idiomMeaningMap = Object.fromEntries(localizeIdioms(IDIOMS, t).map((x) => [x.hanja, x.meaning]));

  return (
    <div className="mobile-center-overlay fixed inset-0 z-[200] flex items-center justify-center" style={{ overflowY: 'hidden' }} onClick={onClose}>
      <div
        className="clay-panel p-4 !rounded-[2rem] border-[3px] border-[#7C83FF] bg-[var(--color-bg-surface)] flex flex-col shadow-2xl shadow-[#7C83FF]/20"
        style={{ width: 'calc(100% - 8px)', maxHeight: '320px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-normal text-[#7C83FF] uppercase tracking-widest">{t('ext_971')}</span>
          <div 
            className="p-3 -mr-3 -mt-3 cursor-pointer" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
          >
            <button className="w-10 h-10 pointer-events-none rounded-full bg-[#F4F7F8] flex items-center justify-center text-[#AEB7C5] text-base font-normal active:scale-90 transition-all">✕</button>
          </div>
        </div>
        <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar">
          {item.words.map((w, i) => (
            <div
              key={i}
              onClick={() => speakKorean(w.reading)}
              className="bg-[#7C83FF]/10 px-3 py-2.5 rounded-xl border border-[#7C83FF]/30 cursor-pointer hover:bg-[#7C83FF]/20 active:scale-[0.98] transition-all flex flex-col justify-between"
            >
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-normal text-base text-slate-700 dark:text-slate-100">{w.word}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#7C83FF] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </div>
                <span className="text-sm font-normal text-[#7C83FF] shrink-0">{w.reading}</span>
              </div>
              <div className="text-sm text-[color:var(--color-text-muted)] dark:text-slate-300 font-normal mt-1">{w.meaning || idiomMeaningMap[w.word]}</div>
            </div>
          ))}
        </div>
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }} 
          className="mt-3 w-full py-2.5 bg-[#7C83FF] text-white text-base font-normal rounded-xl shadow-lg shadow-[#7C83FF]/20 active:scale-[0.98] transition-all"
        >
          {t('ext_470')}
        </button>
      </div>
    </div>
  );
};

export default DailyWordsPopup;
