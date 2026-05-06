import React, { useState, useEffect } from 'react';
import { useLang } from '../LangContext.jsx';

/**
 * 하단: 인터랙티브 미션 바 (Journey Progress)
 * 
 * 여정 맵 클릭 시 하단에서 슬라이드업으로 등장
 * 7개 항목에 대한 각각의 진행도(0/1, 0/5 등)와 보상(+50 XP)을 보여줌
 */

const MissionProgressItem = ({ icon, label, current, total, reward, completed }) => {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3 md:gap-4 py-3 md:py-4 px-3 md:px-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-colors">
      {/* 미니 아이콘 */}
      <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 border border-blue-300 dark:border-blue-600 flex items-center justify-center">
        <img src={icon} alt={label} className="w-6 h-6 md:w-8 md:h-8 object-contain" />
      </div>

      {/* 미션 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-200">
            {label}
          </span>
          <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400">
            {current}/{total}
          </span>
        </div>

        {/* 진행도 바 */}
        <div className="w-full h-2 md:h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600">
          <div
            className={`h-full transition-all duration-500 ${
              completed
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-lg shadow-emerald-400/50'
                : 'bg-gradient-to-r from-amber-400 to-orange-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 보상 배지 */}
      <div className="flex-shrink-0 text-center">
        <div className="text-[10px] md:text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-amber-200 dark:border-amber-700 whitespace-nowrap">
          +{reward} XP
        </div>
      </div>
    </div>
  );
};

const JourneyProgressBar = ({
  isOpen,
  missionData,
  onClose,
  completedStages,
}) => {
  const { t } = useLang();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  // 미션 데이터 (7개 항목)
  const missions = [
    {
      id: 1,
      label: '리뷰 테스트',
      icon: '/assets/images/icons/icon_mission_review_glossy.png',
      current: missionData?.review || 0,
      total: 1,
      reward: 50,
      completed: completedStages >= 1,
    },
    {
      id: 2,
      label: '학습지',
      icon: '/assets/images/icons/icon_flashcard_glossy.png',
      current: missionData?.flashcard || 0,
      total: 5,
      reward: 50,
      completed: completedStages >= 2,
    },
    {
      id: 3,
      label: '단어 퀴즈',
      icon: '/assets/images/icons/icon_mission_word_glossy.png',
      current: missionData?.wordQuiz || 0,
      total: 5,
      reward: 50,
      completed: completedStages >= 3,
    },
    {
      id: 4,
      label: '문장 퀴즈',
      icon: '/assets/images/icons/icon_sentencequiz_glossy.png',
      current: missionData?.sentenceQuiz || 0,
      total: 5,
      reward: 50,
      completed: completedStages >= 4,
    },
    {
      id: 5,
      label: '몬스터 슈팅',
      icon: '/assets/images/icons/icon_monster_glossy.png',
      current: missionData?.shooting || 0,
      total: 5,
      reward: 50,
      completed: completedStages >= 5,
    },
    {
      id: 6,
      label: '메모리 게임',
      icon: '/assets/images/icons/icon_match_glossy.png',
      current: missionData?.memory || 0,
      total: 5,
      reward: 50,
      completed: completedStages >= 6,
    },
    {
      id: 7,
      label: '획순 테스트',
      icon: '/assets/images/icons/icon_writing_glossy.png',
      current: missionData?.stroke || 0,
      total: 5,
      reward: 50,
      completed: completedStages >= 7,
    },
  ];

  // 총 보상 계산
  const totalReward = missions.reduce((sum, m) => (m.completed ? sum + m.reward : sum), 0);
  const completedCount = missions.filter((m) => m.completed).length;

  return (
    <>
      {/* 배경 오버레이 (클릭 시 닫기) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* 슬라이드업 미션 바 */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t-[3px] border-white/80 dark:border-slate-700/80 shadow-2xl rounded-t-[2rem] max-h-[80vh] overflow-y-auto">
          {/* 헤더 */}
          <div className="sticky top-0 px-4 md:px-6 py-4 md:py-5 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-700 rounded-t-[2rem]">
            {/* 드래그 핸들 */}
            <div className="flex justify-center mb-3">
              <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
            </div>

            {/* 제목 */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-black text-slate-700 dark:text-white">
                ⚡ 오늘의 여정 진행도
              </h2>
              <button
                onClick={onClose}
                className="text-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 진행 요약 */}
            <div className="mt-3 flex items-center gap-4 text-xs md:text-sm font-bold">
              <div className="text-slate-600 dark:text-slate-300">
                완료: <span className="text-emerald-600 dark:text-emerald-400">{completedCount}/7</span>
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                총 보상: <span className="text-amber-600 dark:text-amber-400">+{totalReward} XP</span>
              </div>
            </div>
          </div>

          {/* 미션 리스트 */}
          <div className="px-4 md:px-6 py-4 md:py-5 space-y-3 md:space-y-4">
            {missions.map((mission) => (
              <MissionProgressItem
                key={mission.id}
                icon={mission.icon}
                label={mission.label}
                current={mission.current}
                total={mission.total}
                reward={mission.reward}
                completed={mission.completed}
              />
            ))}
          </div>

          {/* 하단 액션 버튼 */}
          <div className="sticky bottom-0 px-4 md:px-6 py-4 md:py-5 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-700 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 md:py-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-black rounded-xl transition-colors"
            >
              닫기
            </button>
            <button
              className="flex-1 py-3 md:py-4 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-black rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              계속 학습하기
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default JourneyProgressBar;
