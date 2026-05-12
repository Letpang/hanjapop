import React from 'react';
import ProfileBox from './ProfileBox.jsx';
import logo3d from '../assets/images/logo_3d.png';

const MenuButton = ({ label, icon, activeColor, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="clay-panel !rounded-[1.5rem] group relative flex flex-row items-center justify-start gap-3 px-4 py-3 md:px-5 md:py-4 transition-all duration-300 overflow-hidden bg-white/95 border-4 border-white active:scale-95"
      style={{ boxShadow: `0 6px 16px ${activeColor}88, 0 2px 6px rgba(0,0,0,0.05)` }}
    >
      <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 drop-shadow-lg z-10">
        <img src={icon} alt={label} className="w-full h-full object-contain" />
      </div>
      <span className="flex-1 font-black text-lg md:text-xl text-center text-[#334155] leading-tight tracking-tighter relative z-10 break-keep pr-8 md:pr-10">
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
    <div className="bg-[#FDFBF7] flex flex-col items-center w-full max-w-[1600px] mx-auto h-[100dvh] relative overflow-x-hidden">

      {/* Tall Full Orange Glow Header - 80% Padding */}
      <div 
        className="sticky top-0 z-30 w-full flex items-center justify-between gap-3 shadow-[0_12px_40px_rgba(255,140,0,0.5)] border-b border-white/20 overflow-hidden py-4 md:py-6"
        style={{ background: 'linear-gradient(to right, #FF8C00, #FFA500)' }}
      >
        {/* Logo - Pushed Left */}
        <div className="flex items-center shrink-0 cursor-pointer pl-6 md:pl-10" onClick={() => onNavigate('main')}>
          <img
            src="/assets/images/logo.png"
            alt="HanjaPop"
            className="h-12 md:h-20 w-auto object-contain drop-shadow-[0_4px_8px_rgba(255,255,255,0.6)]"
          />
        </div>

        {/* Integrated Review Action - Two Lines - Pushed to Far Right */}
        <div 
          className="flex-1 flex items-center justify-end gap-2 cursor-pointer group active:scale-95 transition-transform pr-6 md:pr-14"
          onClick={() => onNavigate('review')}
        >
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex flex-col items-center justify-center mr-2 md:mr-6">
              <span className="text-base md:text-3xl font-black text-white/90 tracking-tighter leading-none mb-1">
                오답 한자 몬스터
              </span>
              <span className="text-xl md:text-5xl font-black text-white tracking-tighter leading-none whitespace-nowrap drop-shadow-md">
                격파하러 가기!
              </span>
            </div>
            
            {/* Monster with Glowing Ray Effect */}
            <div className="flex items-center gap-1 md:gap-3">
              <div className="relative flex items-center justify-center group-hover:scale-110 transition-transform">
                {/* Ray/Glow background */}
                <div className="absolute w-20 h-20 md:w-40 md:h-40 bg-white/40 rounded-full blur-3xl scale-150 animate-pulse"></div>
                <img src="/assets/images/icons/icon_monster_glossy.png" alt="monster" className="relative w-10 h-10 md:w-24 md:h-24 object-contain drop-shadow-2xl z-10" />
              </div>
              <span className="text-2xl md:text-8xl font-black tracking-tighter leading-none drop-shadow-xl" style={{ color: '#CCFF00' }}>
                +XP
              </span>
            </div>

            {/* Explicit Balanced Gap for Arrow Button */}
            <div className="w-8 h-8 md:w-16 md:h-16 rounded-full bg-white/30 flex items-center justify-center text-white text-lg md:text-3xl font-black shadow-lg shrink-0 ml-6 md:ml-12">
              →
            </div>
          </div>
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
                <p className="text-base font-black tracking-tighter" style={{ color: titleColor }}>{sub}</p>
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
              <span className="text-white/90 font-black text-[10px] md:text-xs uppercase tracking-[0.25em] mb-1 drop-shadow-sm">Next Challenge</span>
              <span className="text-white font-black text-2xl md:text-4xl tracking-tighter drop-shadow-md">
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
