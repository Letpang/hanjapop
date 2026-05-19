import React from 'react';
import ProfileBox from './ProfileBox.jsx';
import logo3d from '../assets/images/logo_3d.webp';

const MenuButton = ({ label, icon, activeColor, onClick, isDarkMode }) => {
  let glowStyle = {};
  if (activeColor === 'gradient') {
    glowStyle = {
      boxShadow: isDarkMode 
        ? '0 8px 24px rgba(46, 214, 197, 0.08), 0 8px 24px rgba(255, 155, 115, 0.08), 0 2px 6px rgba(0,0,0,0.2)' 
        : '0 8px 24px rgba(46, 214, 197, 0.16), 0 8px 24px rgba(255, 155, 115, 0.16), 0 2px 6px rgba(0,0,0,0.04)',
    };
  } else {
    let glowColor = '46, 214, 197'; // default mint
    if (activeColor === '#FF9B73') {
      glowColor = '255, 155, 115'; // coral
    }
    glowStyle = {
      boxShadow: isDarkMode 
        ? `0 6px 16px rgba(${glowColor}, 0.15), 0 2px 6px rgba(0,0,0,0.2)` 
        : `0 6px 16px rgba(${glowColor}, 0.25), 0 2px 6px rgba(0,0,0,0.05)`,
    };
  }

  // Filter color matching the card background (pure white in light mode, deep slate in dark mode)
  const filterColor = isDarkMode ? '#1e293b' : '#ffffff';

  return (
    <button
      onClick={onClick}
      className={`clay-panel !rounded-[1.5rem] group relative flex flex-row items-center justify-start gap-2 md:gap-2.5 px-2.5 py-[1.08rem] sm:px-3 sm:py-[1.3rem] md:px-5 md:py-[1.73rem] transition-all duration-300 overflow-hidden border-4 active:scale-95 ${isDarkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white/95 border-white'}`}
      style={glowStyle}
    >
      {/* 3D Icon Container with background-color tint overlay */}
      <div 
        className="shrink-0 z-10 flex items-center justify-center transition-transform duration-300 group-hover:translate-y-[-4px] relative" 
        style={{ width: 'clamp(2.25rem, 6.5vw, 4.2rem)', height: 'clamp(2.25rem, 6.5vw, 4.2rem)' }}
      >
        {/* Base Image */}
        <img 
          src={icon} 
          alt={label} 
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110" 
        />
        
        {/* Background-matching Frosted Glass / Smoked Glass Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none transition-transform duration-300 group-hover:scale-110"
          style={{
            background: filterColor,
            opacity: 0.38, // Adjusted to 0.38 for maximum clarity and visibility of 3D icons, while maintaining a dreamy unified pastel wash
            WebkitMaskImage: `url(${icon})`,
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskImage: `url(${icon})`,
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
          }}
        />
      </div>
      <span className={`flex-1 font-extrabold text-center leading-snug tracking-tighter relative z-10 break-keep transition-colors duration-300 ${isDarkMode ? 'text-slate-100 group-hover:text-white' : 'text-[#3C3C3C] group-hover:text-black'}`} style={{ fontSize: 'clamp(1.2rem, 5.5vw, 2rem)' }}>
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
  streak,
}) => {
  const myXp = userXp || 0;
  const wrongCount = Object.values(mastery).filter(m => (m.wrongCount || 0) > 0).length;

  const gridItems = [
    { id: 'flashcard',    label: '한자 학습지',   icon: '/assets/images/icons/menu_flashcard.webp',    color: '#2ED6C5' },
    { id: 'matchGame',    label: '메모리 게임', icon: '/assets/images/icons/menu_match_game.webp',   color: '#FF9B73' },
    { id: 'shootGame',    label: '몬스터 슈팅', icon: '/assets/images/icons/menu_shoot_game.webp',   color: '#FF9B73' },
    { id: 'wordQuiz',     label: '단어 퀴즈',   icon: '/assets/images/icons/menu_word_quiz.webp',    color: 'gradient' },
    { id: 'sentenceQuiz', label: '문장 퀴즈',   icon: '/assets/images/icons/menu_sentence_quiz.webp', color: 'gradient' },
    { id: 'writing',      label: '한자 쓰기',     icon: '/assets/images/icons/menu_writing.webp',      color: '#2ED6C5' },
  ];

  return (
    <div className={`${isDarkMode ? 'bg-slate-900' : 'bg-[#F7FAF9]'} flex flex-col items-center w-full max-w-[1600px] mx-auto h-[100dvh] relative overflow-x-hidden`}>

      {/* Clean White Header */}
      <div 
        className={`sticky top-0 z-30 w-full flex items-center justify-between gap-3 shadow-sm border-b overflow-hidden py-2 md:py-3 ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-[#E9EDF2]'} backdrop-blur-md`}
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)' }}
      >
        {/* Logo - Pushed Left */}
        <div className="flex items-center shrink-0 cursor-pointer pl-4 md:pl-8" onClick={() => onNavigate('main')}>
          <span style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(1.4rem, 4vw, 2rem)',
            color: '#2ED6C5',
            letterSpacing: '-0.01em',
            textShadow: '0 2px 8px rgba(46,214,197,0.3)',
          }}>HanjaPop</span>
        </div>

        {/* Settings Button */}
        <div className="pr-4 md:pr-8 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate('settings'); }}
            className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center active:scale-90 transition-all ${isDarkMode ? 'bg-slate-800 text-[#AEB7C5]' : 'bg-white text-[#AEB7C5]'}`}
            style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,1), inset 0 -2px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              className="w-5 h-5 md:w-6 md:h-6">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1-1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
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
            streak={streak}
          />
        </div>

        <div className="w-full max-w-5xl flex flex-col gap-10 relative z-10 animate-fade-in-up delay-100">
          {[
            { sub: 'study',   titleColor: '#2ED6C5', items: ['flashcard', 'writing'] },
            { sub: 'quiz',    titleColor: 'gradient', items: ['wordQuiz', 'sentenceQuiz'] },
            { sub: 'game',    titleColor: '#FF9B73', items: ['matchGame', 'shootGame'] },
          ].map(({ sub, titleColor, items }) => (
            <div key={sub}>
              <div className="flex items-center gap-2 mb-[6px] ml-1">
                {titleColor === 'gradient' ? (
                  <p 
                    className="text-h3 font-medium tracking-tighter" 
                    style={{ 
                      backgroundImage: 'linear-gradient(135deg, #2ED6C5 0%, #FF9B73 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 2px 4px rgba(46, 214, 197, 0.15)) drop-shadow(0 2px 4px rgba(255, 155, 115, 0.15))'
                    }}
                  >
                    {sub}
                  </p>
                ) : (
                  <p className="text-h3 font-medium tracking-tighter" style={{ 
                    color: titleColor, 
                    filter: `drop-shadow(0 2px 4px ${
                      titleColor === '#2ED6C5' 
                        ? 'rgba(46, 214, 197, 0.3)' 
                        : 'rgba(255, 155, 115, 0.3)'
                    })` 
                  }}>{sub}</p>
                )}
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

        <div className="w-full max-w-5xl flex flex-col gap-16 animate-fade-in-up delay-200 mt-4">
          {/* Next Stage Button */}
          <button
            onClick={onStartNextStage}
            className="w-full !rounded-[2rem] flex items-center justify-between px-6 md:px-8 py-[20px] md:py-[26px] active:scale-[0.98] transition-all group"
            style={{
              background: 'linear-gradient(135deg, #FF9B73 0%, #FF6B6B 100%)',
              boxShadow: '0 12px 32px rgba(255, 155, 115 , 0.4), 0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <div className="flex flex-col items-start text-left">
              <span className="text-white/90 font-extrabold text-xs-res uppercase tracking-[0.25em] mb-1 drop-shadow-sm">Next Challenge</span>
              <span className="text-white font-extrabold text-h3-res drop-shadow-md whitespace-nowrap break-keep">
                {`스테이지${currentDay || 1} 시작하기`}
              </span>
            </div>
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner"
              style={{ background: 'rgba(255,255,255,0.2)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.08)' }}>
              <img src="/assets/images/icons/button.webp" alt="Start" className="w-10 h-10 md:w-14 md:h-14 object-contain" style={{ filter: 'brightness(0) invert(1) sepia(0.15) brightness(1.05) drop-shadow(0 4px 6px rgba(100,80,40,0.5)) drop-shadow(0 -1px 2px rgba(255,255,255,0.9))' }} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainMenuRenewal;
