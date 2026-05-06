/**
 * JourneyProgressBar.jsx
 * 시안 기반: 슬림 캡슐 형태의 여정 진행 바
 */

import React from 'react';

const JourneyProgressBar = ({ isOpen, missionData, onClose, completedStages }) => {
  if (!isOpen) return null;

  // 전체 7단계 중 진행도 계산
  const totalStages = 7;
  const progressPct = Math.min(100, (completedStages / totalStages) * 100);

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[100] animate-fade-in-up">
      {/* 슬림 캡슐 바 */}
      <div 
        className="w-full max-w-2xl mx-auto clay-panel p-2 md:p-3 bg-white/90 dark:bg-slate-900/90 border-2 border-white/80 shadow-2xl flex items-center gap-4 px-6 rounded-full"
        style={{ height: '64px' }}
      >
        {/* 진행도 텍스트 */}
        <div className="shrink-0 flex flex-col">
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">PROGRESS</span>
          <span className="text-sm font-black text-slate-700 dark:text-white leading-none">
            {completedStages}<span className="text-slate-400">/{totalStages}</span>
          </span>
        </div>

        {/* 가로 메인 게이지 */}
        <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
          <div 
            className="h-full rounded-full transition-all duration-1000 ease-out relative"
            style={{ 
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #6366f1, #a855f7)',
              boxShadow: '0 0 10px rgba(99, 102, 241, 0.4)'
            }}
          >
            {/* 글로시 광택 효과 */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-full" />
          </div>
        </div>

        {/* 보상 정보 */}
        <div className="shrink-0 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-full border border-amber-100 dark:border-amber-800">
          <span className="text-amber-500 text-sm font-black">+50</span>
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">XP</span>
          <div className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
            ★
          </div>
        </div>

        {/* 닫기/축소 버튼 */}
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* 안내 말풍선 (선택 사항) */}
      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-lg shadow-lg animate-bounce">
        오늘의 여정을 완료하고 보상을 받으세요!
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-indigo-600 rotate-45" />
      </div>
    </div>
  );
};

export default JourneyProgressBar;
