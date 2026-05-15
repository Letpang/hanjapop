import React from 'react';
import ProfileBox from './ProfileBox.jsx';
import logo3d from '../assets/images/logo_3d.png';

const MenuButton = ({ label, icon, activeColor, onClick, isDarkMode }) => {
  return (
    <button
      onClick={onClick}
      className={`clay-panel !rounded-[1.5rem] group relative flex flex-row items-center justify-start gap-3 px-4 py-3 md:px-5 md:py-4 transition-all duration-300 overflow-hidden border-4 active:scale-95 ${isDarkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white/95 border-white'}`}
      style={{ boxShadow: `0 6px 16px ${activeColor}88, 0 2px 6px rgba(0,0,0,0.05)` }}
    >
      <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 drop-shadow-lg z-10">
        <img src={icon} alt={label} className="w-full h-full object-contain" />
      </div>
      <span className={`flex-1 font-extrabold text-lg md:text-xl text-center leading-tight tracking-tighter relative z-10 break-keep pr-8 md:pr-10 ${isDarkMode ? 'text-slate-100' : 'text-[#334155]'}`}>
        {label}
      </span>
    </button>
  );
};

const TOTAL_STAGES = 124;

const MainMenuRenewal = ({
  userNickname,
  userXp,
  onNavigate,
  missions,
  doneCount,
  selectedCharacter,
  mastery = {},
  currentDay,
  onStartNextStage,
  isDarkMode,
}) => {
  const myXp = userXp || 0;
  const wrongCount = Object.values(mastery).filter(m => (m.wrongCount || 0) > 0).length;

  const gridItems = [
    { id: 'flashcard',    label: '한자 학습지', icon: '/assets/images/icons/menu_flashcard.png',    color: '#A8E6CF' },
    { id: 'matchGame',    label: '메모리 게임', icon: '/assets/images/icons/menu_match_game.png',   color: '#BDB2FF' },
    { id: 'shootGame',    label: '몬스터 슈팅', icon: '/assets/images/icons/menu_shoot_game.png',   color: '#FFADAD' },
    { id: 'wordQuiz',     label: '단어 퀴즈',   icon: '/assets/images/icons/menu_word_quiz.png',    color: '#A0E4FF' },
    { id: 'sentenceQuiz', label: '문장 퀴즈',   icon: '/assets/images/icons/menu_sentence_quiz.png', color: '#C7D2FE' },
    { id: 'writing',      label: '한자 쓰기',   icon: '/assets/images/icons/menu_writing.png',      color: '#FFD3B6' },
  ];

  return (
    <div className={`${isDarkMode ? 'bg-slate-900' : 'bg-[#FDFBF7]'} flex flex-col items-center w-full max-w-[1600px] mx-auto h-[100dvh] relative overflow-x-hidden`}>

      {/* Tall Full Orange Glow Header - 80% Padding */}
      <div 
        className="sticky top-0 z-30 w-full flex items-center justify-between gap-3 shadow-[0_12px_40px_rgba(255,140,0,0.5)] border-b border-white/20 overflow-hidden py-2 md:py-3"
        style={{ background: 'linear-gradient(to right, #FF8C00, #FFA500)', paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)' }}
      >
        {/* Logo - Pushed Left */}
        <div className="flex items-center shrink-0 cursor-pointer pl-6 md:pl-10" onClick={() => onNavigate('main')}>
          <img
            src="/assets/images/logo.png"
            alt="HanjaPop"
            className="h-12 md:h-20 w-auto object-contain drop-shadow-[0_4px_8px_rgba(255,255,255,0.6)]"
          />
        </div>

        {/* Settings Button */}
        <div className="pr-6 md:pr-10 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate('settings'); }}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/25 flex items-center justify-center active:scale-90 transition-all shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              className="w-5 h-5 md:w-6 md:h-6">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center w-full px-6 pt-5 pb-20 gap-14">
        <div className="w-full animate-fade-in-up cursor-pointer active:scale-[0.98] transition-transform" onClick={() => onNavigate('mypage')}>
          <ProfileBox
            selectedCharacter={selectedCharacter}
            userNickname={userNickname}
            userXp={myXp}
            onNavigate={onNavigate}
          />
        </div>

        <div className="w-full max-w-5xl flex flex-col gap-10 relative z-10 animate-fade-in-up delay-100">
          {[
            { sub: '공부하고!',   titleColor: '#45A081', items: ['flashcard', 'writing'],     color: '#A8E6CF' },
            { sub: '퀴즈 풀고!', titleColor: '#5C9DC0', items: ['wordQuiz', 'sentenceQuiz'], color: '#A0E4FF' },
            { sub: '게임하고!',   titleColor: '#E57373', items: ['matchGame', 'shootGame'],   color: '#FFADAD' },
          ].map(({ sub, titleColor, items, color }) => (
            <div key={sub}>
              <div className="flex items-center gap-2 mb-[6px] ml-1">
                <p className="text-base font-extrabold tracking-tighter" style={{ color: titleColor }}>{sub}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {items.map(id => {
                  const item = gridItems.find(g => g.id === id);
                  return (
                    <MenuButton
                      key={item.id}
                      label={item.label}
                      icon={item.icon}
                      activeColor={item.color}
                      onClick={() => onNavigate(item.id)}
                      isDarkMode={isDarkMode}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="w-full max-w-5xl flex flex-col gap-16 animate-fade-in-up delay-200 mt-10">
          {/* Next Stage Button */}
          <button
            onClick={onStartNextStage}
            className="w-full clay-panel !rounded-[2rem] flex items-center justify-between px-8 md:px-10 py-[20px] md:py-[26px] border-4 border-white active:scale-[0.98] transition-all group"
            style={{
              background: 'linear-gradient(135deg, #4ADE80 0%, #22C55E 100%)',
              boxShadow: '0 12px 32px rgba(34, 197, 197, 0.4), 0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <div className="flex flex-col items-start text-left">
              <span className="text-white/90 font-extrabold text-[10px] md:text-xs uppercase tracking-[0.25em] mb-1 drop-shadow-sm">Next Challenge</span>
              <span className="text-white font-extrabold text-2xl md:text-4xl tracking-tighter drop-shadow-md">
                스테이지 {currentDay || 1} 시작하기
              </span>
            </div>
            <div className="w-14 h-14 md:w-20 md:h-20 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
              <img src="/assets/images/icons/button.png" alt="Start" className="w-10 h-10 md:w-14 md:h-14 object-contain" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainMenuRenewal;
