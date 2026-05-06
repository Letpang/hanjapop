import React, { useState, useRef, useEffect } from 'react';
import { useLang } from '../LangContext.jsx';

/**
 * 최적화된 7단계 여정 맵 (Today's Journey Map)
 * 
 * 맵 구성 (7개 노드):
 * 1. 리뷰 테스트 (시작점, 가장 크고 반짝임)
 * 2. 학습지
 * 3. 단어 퀴즈
 * 4. 문장 퀴즈
 * 5. 몬스터 슈팅
 * 6. 메모리 게임
 * 7. 획순 테스트
 */

const JourneyNode = ({
  id,
  label,
  icon,
  completed,
  locked,
  isStartNode,
  onClick,
  position,
}) => {
  const baseSize = isStartNode ? 'w-20 h-20 md:w-24 md:h-24' : 'w-16 h-16 md:w-20 md:h-20';
  const textSize = isStartNode ? 'text-xs md:text-sm' : 'text-[10px] md:text-xs';

  return (
    <button
      onClick={locked ? undefined : onClick}
      className={`absolute flex flex-col items-center gap-1 transition-all duration-300 ${
        locked ? 'cursor-default' : 'cursor-pointer hover:scale-110'
      }`}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
      disabled={locked}
    >
      {/* 노드 배경 및 아이콘 */}
      <div
        className={`${baseSize} rounded-3xl flex items-center justify-center relative transition-all duration-300 ${
          completed
            ? 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border-[3px] border-emerald-400 dark:border-emerald-500 shadow-lg'
            : locked
            ? 'bg-slate-100/40 dark:bg-slate-700/30 border-[3px] border-slate-300 dark:border-slate-600 opacity-50 blur-sm'
            : isStartNode
            ? 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 border-[3px] border-purple-400 dark:border-purple-500 shadow-lg'
            : 'bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 border-[3px] border-blue-300 dark:border-blue-500 shadow-md'
        }`}
      >
        {/* 시작 노드의 외부 광채 효과 */}
        {isStartNode && !locked && (
          <>
            <div
              className="absolute inset-0 rounded-3xl animate-pulse"
              style={{
                boxShadow:
                  '0 0 30px rgba(168, 85, 247, 0.6), inset 0 0 20px rgba(168, 85, 247, 0.3)',
              }}
            />
            {/* 추가 반짝임 효과 */}
            <div
              className="absolute inset-0 rounded-3xl"
              style={{
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                boxShadow: '0 0 50px rgba(168, 85, 247, 0.4)',
              }}
            />
          </>
        )}

        {/* 아이콘 */}
        <img
          src={icon}
          alt={label}
          className={`${isStartNode ? 'w-12 h-12 md:w-14 md:h-14' : 'w-10 h-10 md:w-12 md:h-12'} object-contain relative z-10`}
        />

        {/* 완료 체크마크 */}
        {completed && (
          <div className="absolute -top-1 -right-1 w-6 h-6 md:w-7 md:h-7 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-black shadow-md border-2 border-white">
            ✓
          </div>
        )}
      </div>

      {/* 노드 레이블 */}
      <span
        className={`${textSize} font-black text-center text-slate-700 dark:text-slate-300 leading-tight whitespace-nowrap mt-1 ${
          completed ? 'text-emerald-600 dark:text-emerald-400' : ''
        }`}
      >
        {label}
      </span>
    </button>
  );
};

const JourneyMapOptimized = ({
  completedStages,
  currentStage,
  onNodeClick,
  onMapClick,
}) => {
  const { t } = useLang();
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // 컨테이너 크기 감지
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 노드 위치 (백분율) - 시안 기반 Up-Down 지그재그 배치
  const nodePositions = [
    { x: 10, y: 30 },   // 1. 리뷰 테스트 (상)
    { x: 25, y: 70 },   // 2. 뭉치 학습지 (하)
    { x: 40, y: 30 },   // 3. 단어 퀴즈 (상)
    { x: 55, y: 70 },   // 4. 문장 퀴즈 (하)
    { x: 70, y: 30 },   // 5. 몬스터 슈팅 (상)
    { x: 85, y: 70 },   // 6. 메모리 게임 (하)
    { x: 95, y: 30 },   // 7. 획순 테스트 (상/우측)
  ];

  // 노드 데이터
  const nodes = [
    {
      id: 1,
      label: '리뷰 테스트',
      icon: '/assets/images/icons/icon_mission_review_glossy.png',
      isStartNode: true,
    },
    {
      id: 2,
      label: '학습지',
      icon: '/assets/images/icons/icon_flashcard_glossy.png',
      isStartNode: false,
    },
    {
      id: 3,
      label: '단어 퀴즈',
      icon: '/assets/images/icons/icon_mission_word_glossy.png',
      isStartNode: false,
    },
    {
      id: 4,
      label: '문장 퀴즈',
      icon: '/assets/images/icons/icon_sentencequiz_glossy.png',
      isStartNode: false,
    },
    {
      id: 5,
      label: '몬스터 슈팅',
      icon: '/assets/images/icons/icon_monster_glossy.png',
      isStartNode: false,
    },
    {
      id: 6,
      label: '메모리 게임',
      icon: '/assets/images/icons/icon_match_glossy.png',
      isStartNode: false,
    },
    {
      id: 7,
      label: '획순 테스트',
      icon: '/assets/images/icons/icon_writing_glossy.png',
      isStartNode: false,
    },
  ];

  // 연결선 경로
  const connections = [
    [0, 1], // 리뷰 → 학습지
    [1, 2], // 학습지 → 단어 퀴즈
    [2, 3], // 단어 퀴즈 → 문장 퀴즈
    [3, 4], // 문장 퀴즈 → 몬스터 슈팅
    [4, 5], // 몬스터 슈팅 → 메모리 게임
    [5, 6], // 메모리 게임 → 획순 테스트
  ];

  // 백분율을 픽셀로 변환
  const percentToPixel = (percent, dimension) => {
    return (containerSize[dimension] * percent) / 100;
  };

  return (
    <div
      ref={containerRef}
      onClick={onMapClick}
      className="w-full clay-panel px-4 py-6 md:py-8 bg-white/70 dark:bg-slate-900/50 border-[3px] border-white/80 backdrop-blur-md shadow-lg rounded-[2rem] relative cursor-pointer hover:shadow-xl transition-shadow overflow-hidden min-h-[280px] md:min-h-[360px]"
    >
      {/* 맵 타이틀 */}
      <div className="flex justify-between items-center mb-10 relative z-20 px-2">
        <h3 className="font-black text-slate-700 dark:text-white text-lg md:text-xl flex items-center gap-2">
          🗺️ 오늘의 여정 ({completedStages}/{nodes.length})
        </h3>
        <div className="text-[10px] md:text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800 animate-pulse">
          미션 바 활성화
        </div>
      </div>

      {/* SVG 연결선 */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none', top: '40px' }} // 타이틀 영역 고려
      >
        <defs>
          <linearGradient id="completedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="1" />
          </linearGradient>
        </defs>

        {connections.map((conn, idx) => {
          const fromPos = nodePositions[conn[0]];
          const toPos = nodePositions[conn[1]];
          const fromX = percentToPixel(fromPos.x, 'width');
          const fromY = percentToPixel(fromPos.y, 'height');
          const toX = percentToPixel(toPos.x, 'width');
          const toY = percentToPixel(toPos.y, 'height');

          const isCompleted = conn[0] < completedStages;

          return (
            <g key={idx}>
              <line
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
                stroke={isCompleted ? '#10b981' : '#cbd5e1'}
                strokeWidth={isCompleted ? 6 : 3}
                strokeLinecap="round"
                strokeDasharray={isCompleted ? 'none' : '8,8'}
                opacity={isCompleted ? 0.6 : 0.3}
                className={isCompleted ? 'animate-pulse' : ''}
              />
            </g>
          );
        })}
      </svg>

      {/* 노드들 */}
      <div className="relative w-full h-full mt-4">
        {nodes.map((node, idx) => {
          const pos = nodePositions[idx];
          const isCompleted = idx < completedStages;
          const isLocked = idx > completedStages;
          const isCurrent = idx === completedStages;

          return (
            <JourneyNode
              key={node.id}
              id={node.id}
              label={node.label}
              icon={node.icon}
              completed={isCompleted}
              locked={isLocked}
              isStartNode={node.isStartNode || isCurrent}
              onClick={(e) => {
                e.stopPropagation(); // 맵 클릭 이벤트 방지
                if (!isLocked) onNodeClick(idx + 1);
              }}
              position={{
                x: `${pos.x}%`,
                y: `${pos.y}%`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default JourneyMapOptimized;
