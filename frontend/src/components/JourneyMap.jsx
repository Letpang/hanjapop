import React, { useState, useRef, useEffect } from 'react';
import { useLang } from '../LangContext.jsx';

/**
 * 중앙: 7단계 여정 맵 (Today's Journey Map)
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
            ? 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 border-[3px] border-purple-400 dark:border-purple-500 shadow-lg animate-pulse'
            : 'bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 border-[3px] border-blue-300 dark:border-blue-500 shadow-md'
        }`}
      >
        {/* 시작 노드의 외부 광채 효과 */}
        {isStartNode && !locked && (
          <div
            className="absolute inset-0 rounded-3xl animate-pulse"
            style={{
              boxShadow:
                '0 0 30px rgba(168, 85, 247, 0.6), inset 0 0 20px rgba(168, 85, 247, 0.3)',
            }}
          />
        )}

        {/* 아이콘 */}
        <img
          src={icon}
          alt={label}
          className={`${isStartNode ? 'w-12 h-12 md:w-14 md:h-14' : 'w-10 h-10 md:w-12 md:h-12'} object-contain relative z-10`}
        />

        {/* 완료 체크마크 */}
        {completed && (
          <div className="absolute -top-1 -right-1 w-6 h-6 md:w-7 md:h-7 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-black shadow-md">
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

const JourneyMap = ({
  completedStages,
  currentStage,
  onNodeClick,
  onMapClick,
}) => {
  const { t } = useLang();
  const containerRef = useRef(null);
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

  // 노드 위치 계산 (화면 비율에 맞춰 유동적으로)
  const nodePositions = [
    { x: '15%', y: '50%' },   // 리뷰 테스트 (시작점, 좌측)
    { x: '25%', y: '30%' },   // 학습지
    { x: '40%', y: '20%' },   // 단어 퀴즈
    { x: '60%', y: '20%' },   // 문장 퀴즈
    { x: '75%', y: '30%' },   // 몬스터 슈팅
    { x: '85%', y: '50%' },   // 메모리 게임
    { x: '60%', y: '70%' },   // 획순 테스트
  ];

  // 노드 데이터
  const nodes = [
    {
      id: 1,
      label: '리뷰 테스트',
      icon: '/assets/images/icons/node_review.png',
      isStartNode: true,
    },
    {
      id: 2,
      label: '학습지',
      icon: '/assets/images/icons/node_flashcard.png',
      isStartNode: false,
    },
    {
      id: 3,
      label: '단어 퀴즈',
      icon: '/assets/images/icons/node_word_quiz.png',
      isStartNode: false,
    },
    {
      id: 4,
      label: '문장 퀴즈',
      icon: '/assets/images/icons/node_sentence_quiz.png',
      isStartNode: false,
    },
    {
      id: 5,
      label: '몬스터 슈팅',
      icon: '/assets/images/icons/node_monster_shooting.png',
      isStartNode: false,
    },
    {
      id: 6,
      label: '메모리 게임',
      icon: '/assets/images/icons/node_memory_game.png',
      isStartNode: false,
    },
    {
      id: 7,
      label: '획순 테스트',
      icon: '/assets/images/icons/node_stroke_test.png',
      isStartNode: false,
    },
  ];

  // 연결선 경로 (노드 간 연결)
  const connections = [
    [0, 1], // 리뷰 → 학습지
    [1, 2], // 학습지 → 단어 퀴즈
    [2, 3], // 단어 퀴즈 → 문장 퀴즈
    [3, 4], // 문장 퀴즈 → 몬스터 슈팅
    [4, 5], // 몬스터 슈팅 → 메모리 게임
    [5, 6], // 메모리 게임 → 획순 테스트
  ];

  // 백분율 좌표를 픽셀 좌표로 변환
  const convertPosition = (posStr) => {
    const percent = parseInt(posStr);
    return (containerSize.width * percent) / 100;
  };

  return (
    <div
      ref={containerRef}
      onClick={onMapClick}
      className="w-full h-80 md:h-96 lg:h-[28rem] clay-panel px-4 py-6 md:py-8 bg-white/70 dark:bg-slate-900/50 border-[3px] border-white/80 backdrop-blur-md shadow-lg rounded-[2rem] relative cursor-pointer hover:shadow-xl transition-shadow"
    >
      {/* SVG 연결선 */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      >
        {connections.map((conn, idx) => {
          const fromPos = nodePositions[conn[0]];
          const toPos = nodePositions[conn[1]];
          const fromX = (containerSize.width * parseInt(fromPos.x)) / 100;
          const fromY = (containerSize.height * parseInt(fromPos.y)) / 100;
          const toX = (containerSize.width * parseInt(toPos.x)) / 100;
          const toY = (containerSize.height * parseInt(toPos.y)) / 100;

          // 연결선 색상: 완료된 구간은 그라데이션, 미완료는 회색
          const isCompleted = conn[0] < currentStage;
          const strokeColor = isCompleted
            ? 'url(#completedGradient)'
            : 'currentColor';

          return (
            <g key={idx}>
              {/* 그라데이션 정의 */}
              {isCompleted && (
                <defs>
                  <linearGradient
                    id="completedGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="1" />
                  </linearGradient>
                </defs>
              )}

              {/* 연결선 */}
              <line
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
                stroke={isCompleted ? '#10b981' : '#cbd5e1'}
                strokeWidth={isCompleted ? 3 : 2}
                strokeLinecap="round"
                className={isCompleted ? 'drop-shadow-md' : 'dark:stroke-slate-600'}
              />

              {/* 완료 표시: 선 위에 체크마크 */}
              {isCompleted && (
                <circle
                  cx={(fromX + toX) / 2}
                  cy={(fromY + toY) / 2}
                  r={6}
                  fill="#10b981"
                  className="drop-shadow-md"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* 노드들 */}
      <div className="relative w-full h-full">
        {nodes.map((node, idx) => {
          const posStr = nodePositions[idx];
          const x = `${posStr.x}`;
          const y = `${posStr.y}`;
          const isCompleted = idx < currentStage;
          const isLocked = idx > currentStage;

          return (
            <JourneyNode
              key={node.id}
              id={node.id}
              label={node.label}
              icon={node.icon}
              completed={isCompleted}
              locked={isLocked}
              isStartNode={node.isStartNode}
              onClick={() => !isLocked && onNodeClick(idx + 1)}
              position={{ x, y }}
            />
          );
        })}
      </div>

      {/* 중앙 안내 텍스트 */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 text-center pointer-events-none">
        노드를 클릭하여 여정을 시작하세요
      </div>
    </div>
  );
};

export default JourneyMap;
