import React, { useState, useEffect } from 'react';
import { usePremium } from '../hooks/usePremium.js';
import DAILY_CURRICULUM from '../data/dailyCurriculum.js';
import { getRankDetails } from '../utils/rankUtils.js';
import CtaButton from './common/CtaButton.jsx';

const TOTAL_STAGES = 124;

const GRADES = [
    { label: '8급',  firstStage: 1,  color: '#2ED6C5' },
    { label: '7급Ⅱ', firstStage: 18, color: '#7C83FF' },
    { label: '7급',  firstStage: 36, color: '#9B6BFF' },
    { label: '6급Ⅱ', firstStage: 54, color: '#FF9B73' },
    { label: '6급',  firstStage: 89, color: '#FF6B6B' },
];

const FLOAT_CSS = `
@keyframes mm-float {
    0%   { transform: translateY(0px); }
    50%  { transform: translateY(-8px); }
    100% { transform: translateY(0px); }
}
@keyframes mm-float-fast {
    0%   { transform: translateY(0px); }
    50%  { transform: translateY(-6px); }
    100% { transform: translateY(0px); }
}
@keyframes mm-sparkle {
    0%, 100% { opacity: 0.45; transform: scale(0.9) rotate(0deg); }
    50%      { opacity: 1; transform: scale(1.1) rotate(8deg); }
}
@keyframes mm-cta-shine {
    0%   { transform: translateX(-130%) skewX(-14deg); opacity: 0; }
    18%  { opacity: 0.75; }
    42%  { opacity: 0.25; }
    100% { transform: translateX(170%) skewX(-14deg); opacity: 0; }
}
`;

const MISSION_META = {
    flashcard:    { label: '한자 학습지', icon: '/assets/images/icons/study.webp',    nav: 'flashcard',    color: '#FF9B73' },
    wordQuiz:     { label: '단어 퀴즈',   icon: '/assets/images/icons/words.webp',    nav: 'wordQuiz',     color: '#7C83FF' },
    sentenceQuiz: { label: '문장 퀴즈',   icon: '/assets/images/icons/sentence.webp', nav: 'sentenceQuiz', color: '#7C83FF' },
    shootGame:    { label: '몬스터 슈팅', icon: '/assets/images/icons/monster.webp',  nav: 'shootGame',    color: '#2ED6C5' },
    matchGame:    { label: '메모리 게임', icon: '/assets/images/icons/matching.webp', nav: 'matchGame',    color: '#2ED6C5' },
    writing:      { label: '한자 획순',   icon: '/assets/images/icons/writing.webp',  nav: 'writing',      color: '#FFB347' },
    idiomQuiz:    { label: '사자성어',     icon: null,                               nav: 'idiomQuiz',    color: '#9B6BFF' },
};

const MainMenuRenewal = ({
    userNickname,
    userXp,
    onNavigate,
    missions,
    doneCount,
    selectedCharacter,
    currentDay,
    completedDay = 0,
    onStartNextStage,
    onSelectPastStage,
    selectedPastStage,
    onSelectGrade,
    selectedGrade,
    isDarkMode,
    streak,
}) => {
    const myXp        = userXp || 0;
    const [showModal,     setShowModal]     = useState(false);
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [showGameModal, setShowGameModal] = useState(false);
    const [mounted,       setMounted]       = useState(false);
    const { showPremiumGate, canAccessStage } = usePremium();

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 40);
        return () => clearTimeout(t);
    }, []);

    const missionTotal = missions?.length || 6;
    const missionDone  = doneCount || 0;
    const allDone      = missionDone >= missionTotal;
    const isDailyComplete = allDone && !selectedPastStage && !selectedGrade;
    const up = (d = 0) => ({
        opacity:   mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 0.4s ease ${d}s, transform 0.4s cubic-bezier(0.25,0.8,0.25,1) ${d}s`,
    });

    return (
        <div className="flex flex-col w-full max-w-[600px] mx-auto h-[100dvh] overflow-hidden relative bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0]">
            <style>{FLOAT_CSS}</style>

            {/* ── 배경 ── */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#E0F7FA]/40 via-[#F1F8E9]/40 to-[#E0F7FA]/40" />
                <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full" style={{ background: '#2ED6C5', filter: 'blur(100px)', opacity: 0.15 }} />
                <div className="absolute top-1/2 -right-20 w-72 h-72 rounded-full" style={{ background: '#7C83FF', filter: 'blur(100px)', opacity: 0.12 }} />
                <div className="absolute -bottom-20 left-1/3 w-80 h-80 rounded-full" style={{ background: '#FF9B73', filter: 'blur(110px)', opacity: 0.15 }} />
            </div>

            {/* ── 헤더 ── */}
            <header 
                className="shrink-0 w-full flex items-center justify-between px-6 relative z-30"
                style={{
                    paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)',
                    paddingBottom: '0.5rem',
                }}
            >
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #2ED6C5 0%, #0D9488 100%)' }}>
                        <span style={{ fontFamily: "'GenJyuuGothic',sans-serif", fontWeight: 900, fontSize: '1rem', color: '#fff' }}>H</span>
                    </div>
                    <span style={{ fontFamily: "'GenJyuuGothic',sans-serif", fontWeight: 900, fontSize: '1.25rem', color: '#5B677A', letterSpacing: '-0.02em' }}>
                        HanjaPop
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {streak?.count > 0 && (
                        <div className="flex items-center gap-1 bg-[#FFF0EB] px-2.5 py-1.5 rounded-full border border-[#FFE4D6] shadow-sm">
                            <span style={{ fontSize: 13 }}>🔥</span>
                            <span className="font-bold text-[#FF9B73] text-[12px] tracking-tight">{streak.count}일</span>
                        </div>
                    )}
                    <button
                        onClick={() => onNavigate('calendar')}
                        className="h-8 w-8 rounded-full border border-[#D7F3EF] bg-white/90 shadow-sm flex items-center justify-center active:scale-95 transition-transform"
                        aria-label="학습 그래프"
                        title="학습 그래프"
                    >
                        <img src="/assets/images/icons/icon_activity.webp" alt="" className="h-4 w-4 object-contain" />
                    </button>
                </div>
            </header>

            {/* ── 스크롤 바디 ── */}
            <div className="flex-1 overflow-y-auto w-full flex flex-col items-center px-5 pt-2 gap-5 relative z-10" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 7rem)' }}>

                {/* 1 ── 탐험가 스테이터스 보드 (ID Card) ── */}
                <div className="w-full max-w-md relative" style={up(0)}>
                    {(() => {
                        const rank = getRankDetails(myXp, selectedCharacter);
                        const xpToNext = rank.nextXp != null ? rank.nextXp - myXp : null;
                        return (
                            <button 
                                onClick={() => onNavigate('mypage')}
                                className="relative w-full text-left rounded-[1.5rem] p-5 shadow-xl overflow-hidden flex items-center gap-4 active:scale-[0.98] hover:shadow-2xl transition-all group"
                                style={{ background: 'linear-gradient(135deg, #ffffff 0%, #F4F7F8 100%)' }}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#2ED6C5] rounded-full blur-[50px] opacity-10 group-hover:opacity-20 transition-opacity" />

                                <div className="shrink-0 relative">
                                    <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center bg-white shadow-inner relative z-10 border-4 border-slate-50">
                                        <img
                                            src={rank.avatar}
                                            alt="character"
                                            className="w-full h-full object-contain p-1"
                                            style={{ filter: 'drop-shadow(0 8px 12px rgba(46,214,197,0.25))' }}
                                            onError={e => { e.target.src = '/assets/images/characters/default_3d.webp'; }}
                                        />
                                    </div>
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#FF9B73] to-[#FF6B6B] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md z-20 border-2 border-white">
                                        Lv.{rank.level}
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col items-start min-w-0 z-10 pr-6">
                                    <h1 className="font-black text-[22px] truncate w-full text-slate-700 tracking-tight leading-tight group-hover:text-[#2ED6C5] transition-colors">
                                        {userNickname || '탐험가'}님
                                    </h1>
                                    
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="font-black text-[10px] px-1.5 py-0.5 rounded bg-[#E0F7FA] text-[#0D9488] border border-[#B2EBF2]">{rank.rankName} 탐험가</span>
                                        <span className="font-bold text-[12px] text-[#8f99ad]">{myXp.toLocaleString()} XP</span>
                                    </div>

                                    <div className="w-full mt-3">
                                        <div className="flex justify-between items-end mb-1 px-0.5">
                                            <span className="text-[10px] font-bold text-[#8f99ad]">
                                                {xpToNext != null ? `다음 랭크까지 ${xpToNext.toLocaleString()} XP` : '최고 랭크 달성!'}
                                            </span>
                                        </div>
                                        <div className="w-full h-[10px] rounded-full bg-slate-200 overflow-hidden shadow-inner">
                                            <div className="quiz-progress-fill"
                                                style={{ width: `${rank.progress}%`, background: 'linear-gradient(90deg, #2ED6C5, #0D9488)' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* 프로필 화살표 아이콘 (Chevron Right) */}
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-[#8f99ad] group-hover:bg-[#E0F7FA] group-hover:text-[#0D9488] transition-colors z-20">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 ml-0.5">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                </div>
                            </button>
                        );
                    })()}
                </div>

                {/* 2+3 ── 탐험 CTA + 급수진행도 ── */}
                <div className="w-full max-w-md relative mt-1 mb-2" style={up(0.08)}>
                    {selectedGrade ? (
                        <div className="flex flex-col gap-3">
                            <div className="w-full rounded-[1.5rem] bg-indigo-50/80 p-5 border border-indigo-100 shadow-sm relative overflow-hidden">
                                <div className="relative z-10 flex flex-col items-center text-center gap-1.5">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 mb-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <h4 className="font-black text-indigo-900 text-[17px] tracking-tight">{selectedGrade} 복습 모드</h4>
                                    <p className="text-[13px] font-bold text-indigo-700/80 leading-snug break-keep">
                                        전체 {selectedGrade} 한자 중 완료한 단계의 한자가<br/>아래 퀘스트에 출제됩니다.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => onSelectGrade(null)}
                                className="w-full py-4 rounded-[1.5rem] bg-white border-2 border-slate-200 text-slate-500 font-bold text-[15px] active:scale-95 transition-all shadow-sm flex justify-center items-center gap-2"
                            >
                                원래 단계로 돌아가기
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* 빼꼼 튀어나온 귀여운 몬스터 복구 (버튼 뒤로 숨김) */}
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
                                onError={(e) => { e.target.style.display='none'; }}
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
                                    <p className="text-[12px] font-black leading-snug text-[#FF6B6B] break-keep relative z-10">
                                        {currentDay}단계 퀘스트 완료! 고생했어요.
                                    </p>
                                    <svg className="absolute top-1/2 -translate-y-1/2 w-[9px] h-[16px]" style={{ right: '-8px' }} viewBox="0 0 9 16" fill="none">
                                        <path d="M-1 1 L7 8 L-1 15" fill="white" stroke="#FFE0D4" strokeWidth="1" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            )}
                            <CtaButton
                                theme={(selectedPastStage || isDailyComplete) ? 'coral' : 'cream'}
                                onClick={onStartNextStage}
                                className="relative z-10 overflow-hidden"
                            >
                                {isDailyComplete && (
                                    <span
                                        className="absolute inset-y-0 left-0 w-24 bg-white/30 pointer-events-none"
                                        style={{ animation: 'mm-cta-shine 2.6s ease-in-out infinite' }}
                                    />
                                )}
                                {isDailyComplete && (
                                    <span className="absolute right-[5.5rem] top-5 text-[#FFE7A8] text-[18px] pointer-events-none" style={{ animation: 'mm-sparkle 1.8s ease-in-out infinite' }}>✦</span>
                                )}
                                <div className="w-full flex flex-col relative z-10">
                                    <div className="flex items-center justify-between gap-3 w-full">
                                        <div className="flex items-center gap-4">
                                            <div className="text-left">
                                                <div
                                                    className={`font-black leading-tight ${selectedPastStage || isDailyComplete ? 'text-white drop-shadow-md' : 'text-[#5B677A]'}`}
                                                    style={{ fontSize: '1.65rem', letterSpacing: '-0.02em' }}
                                                >
                                                    {selectedPastStage
                                                        ? `${selectedPastStage}단계 복습하기`
                                                        : isDailyComplete
                                                        ? `다음 탐험으로 가기`
                                                        : `오늘의 탐험 떠나기`}
                                                </div>
                                                <div
                                                    className={`mt-0.5 font-bold ${selectedPastStage || isDailyComplete ? 'text-white' : 'text-[#FF9B73]'}`}
                                                    style={{ fontSize: '1rem' }}
                                                >
                                                    {isDailyComplete
                                                        ? '다음 탐험으로 가볼까요?'
                                                        : '탐험 지도로 이동합니다'}
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className={`shrink-0 flex items-center justify-center rounded-full w-10 h-10 shadow-md relative ${selectedPastStage || isDailyComplete ? 'bg-white text-[#FF6B6B]' : 'bg-[#FF9B73] text-white'}`}
                                            style={isDailyComplete ? { boxShadow: '0 8px 18px rgba(255,255,255,0.35), 0 0 0 6px rgba(255,255,255,0.16)' } : undefined}
                                        >
                                            <span style={{ fontSize: 18, fontWeight: 900, marginLeft: 2 }}>▶</span>
                                        </div>
                                    </div>
                                    <div
                                        className="w-full mt-3 pt-3 flex items-center gap-3"
                                        style={{ borderTop: `1px solid ${selectedPastStage || isDailyComplete ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.07)'}` }}
                                        onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
                                    >
                                        <span className={`font-bold text-xs shrink-0 ${selectedPastStage || isDailyComplete ? 'text-white' : 'text-[#8f99ad]'}`}>급수진행도</span>
                                        <div className="flex-1 flex items-center gap-2 min-w-0">
                                            <div className={`flex-1 rounded-full overflow-hidden h-[8px] shadow-inner ${selectedPastStage || isDailyComplete ? 'bg-white/60' : 'bg-slate-100'}`}>
                                                <div className="quiz-progress-fill" style={{ width: `${Math.round((completedDay / TOTAL_STAGES) * 100)}%`, background: selectedPastStage || isDailyComplete ? 'linear-gradient(90deg, rgba(255,235,220,0.7), rgba(255,255,255,0.95))' : 'linear-gradient(90deg,#FF9B73,#FF6B6B)', boxShadow: selectedPastStage || isDailyComplete ? 'none' : '0 0 8px rgba(255,155,115,0.5)' }} />
                                            </div>
                                            <div
                                                className="flex items-center gap-1.5 pl-3 pr-2.5 py-1.5 rounded-xl shadow-sm shrink-0"
                                                style={selectedPastStage || isDailyComplete
                                                    ? { background: 'rgba(255,255,255,0.92)', border: '1.5px solid rgba(255,255,255,0.7)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
                                                    : { background: 'rgba(255,241,234,0.8)', border: '1px solid rgba(255,225,200,0.6)' }
                                                }
                                            >
                                                <span className="font-black text-[14px]" style={{ color: '#FF6B6B', letterSpacing: '-0.3px' }}>
                                                    {completedDay}/{TOTAL_STAGES}
                                                </span>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-orange-400/80" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CtaButton>
                        </>
                    )}
                </div>

                {/* 4 ── 오늘의 퀘스트 보드 (미션) ── */}
                <div className="w-full max-w-md relative" style={up(0.15)}>
                    <div className="flex flex-wrap items-end justify-between gap-2 mb-3 px-2">
                        <div className="flex flex-col">
                            <span className="font-black text-lg text-slate-700 tracking-tight">오늘의 퀘스트</span>
                            {!allDone && (
                                <span className="font-bold text-xs mt-0.5 text-[#2ED6C5]">
                                    올클리어하면 <span className="text-[#FF9B73]">+200XP 보너스!</span>
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`px-3 py-1 rounded-full font-black text-xs ${allDone ? 'bg-[#2ED6C5] text-white shadow-md' : 'bg-white text-slate-400 border-2 border-slate-100'}`}>
                                {missionDone} / {missionTotal}
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                        {(missions || []).map((m, idx) => {
                            const meta = MISSION_META[m.type] || {};
                            const firstUndoneIdx = (missions || []).findIndex(x => !x.done);
                            const isRecommended = !m.done && idx === firstUndoneIdx;
                            const maxXp = Math.max(...(missions || []).map(x => x.xp));
                            const isCorал = !m.done && !isRecommended && m.xp === maxXp;
                            
                            return (
                                <button
                                    key={m.id}
                                    onClick={() => meta.nav && onNavigate(meta.nav)}
                                    className="w-full flex items-center gap-3 py-3.5 px-4 rounded-[1.5rem] active:scale-[0.97] transition-all bg-white relative overflow-hidden shadow-sm"
                                >
                                    {/* 좌측 컈러 바 */}
                                    <div
                                        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-[1.5rem]"
                                        style={{ background: meta.color || '#2ED6C5', opacity: m.done ? 0.35 : 1 }}
                                    />
                                    <div className="flex-1 flex items-center justify-between min-w-0 relative z-10 pl-1">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="font-black text-[20px] truncate text-slate-700">
                                                {meta.label || m.label}
                                            </span>
                                            {m.done && <span className="bg-[#E0FBF7] text-[#0D9488] text-[11px] font-black px-1.5 py-0.5 rounded-md shrink-0">✓ 완료</span>}
                                            {!m.done && isRecommended && <span className="bg-[#FFFBEB] text-[#D97706] text-[11px] font-black px-1.5 py-0.5 rounded-md shrink-0">추천</span>}
                                            {!m.done && isCorал && <span className="bg-[#FFF0EB] text-[#FF6B6B] text-[11px] font-black px-1.5 py-0.5 rounded-md shrink-0">고XP</span>}
                                        </div>
                                        <span className={`font-black text-xs shrink-0 ml-2 ${m.done ? 'text-slate-300' : 'text-[#FF9B73]'}`}>
                                            미션 +{m.xp}XP
                                        </span>
                                    </div>

                                    <div
                                        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center relative z-10 shadow-sm border-2 text-white"
                                        style={{ background: '#FF9B73', borderColor: '#FF9B73', opacity: m.done ? 0.5 : 1 }}
                                    >
                                        <span style={{ fontSize: 14, fontWeight: 900 }}>▶</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 5 ── 한자 급수시험 준비 ── */}
                <section className="w-full max-w-md" style={up(0.18)}>
                    <div className="flex items-center justify-between mb-3 px-2">
                        <div className="flex flex-col">
                            <span className="font-black text-lg text-slate-700 tracking-tight">한자 급수시험 준비</span>
                            <span className="font-bold text-xs mt-0.5" style={{ color: '#7C83FF' }}>급수별 시험문제 · 오답 단어장</span>
                        </div>
                    </div>
                    <div className="mm-cert-shortcut-grid">
                        <button
                            onClick={() => onNavigate('gradeExamSelect')}
                            className="mm-cert-shortcut mm-cert-shortcut--exam"
                        >
                            <span className="mm-cert-shortcut-mark" aria-hidden="true">級</span>
                            <span className="mm-cert-shortcut-copy">
                                <span className="mm-cert-shortcut-title">급수별 시험</span>
                                <span className="mm-cert-shortcut-desc">8급부터 6급까지 모의시험</span>
                            </span>
                            <span className="mm-cert-shortcut-action">
                                <span>바로가기</span>
                                <span className="mm-cert-shortcut-chevron" aria-hidden="true" />
                            </span>
                        </button>

                        <button
                            onClick={() => onNavigate('wrongVocabulary')}
                            className="mm-cert-shortcut mm-cert-shortcut--wrong"
                        >
                            <span className="mm-cert-shortcut-mark" aria-hidden="true">誤</span>
                            <span className="mm-cert-shortcut-copy">
                                <span className="mm-cert-shortcut-title">오답 단어장</span>
                                <span className="mm-cert-shortcut-desc">틀린 단어만 모아 복습</span>
                            </span>
                            <span className="mm-cert-shortcut-action">
                                <span>바로가기</span>
                                <span className="mm-cert-shortcut-chevron" aria-hidden="true" />
                            </span>
                        </button>
                    </div>
                </section>

                {/* 6 ── 기억의 보관소 (지나간 단계 복습) ── */}
                {completedDay > 1 && (
                    <div className="w-full max-w-md mt-4" style={up(0.20)}>
                        <button
                            onClick={() => setShowModal(true)}
                            className="w-full relative overflow-hidden flex items-center gap-4 px-5 py-4 rounded-[1.5rem] active:scale-[0.98] transition-all bg-white/80 backdrop-blur-md"
                        >
                            <div className="shrink-0 w-12 h-12 rounded-[1rem] flex items-center justify-center bg-[#7C83FF]/10 border border-[#7C83FF]/20 shadow-inner">
                                <span className="text-2xl drop-shadow-sm">🔮</span>
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <div className="font-black text-[15px] text-[#4F56D9] tracking-tight">
                                    기억의 보관소 열기
                                </div>
                                <div className="font-bold text-xs mt-0.5 text-[#8f99ad]">
                                    지나간 1~{completedDay - 1}단계 다시 학습하기
                                </div>
                            </div>
                            <div className="shrink-0 text-[#7C83FF]/50 font-bold">
                                ❯
                            </div>
                        </button>
                    </div>
                )}

            </div>

            {/* ── 퀴즈 선택 모달 ── */}
            {showQuizModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setShowQuizModal(false)}>
                    <div className="w-full max-w-lg flex flex-col gap-3 p-6 pb-10" style={{ background: '#fff', borderRadius: '2rem 2rem 0 0' }}
                        onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 style={{ fontSize: 17, fontWeight: 900, color: '#1A2B2A' }}>한자 어휘</h3>
                            <button onClick={() => setShowQuizModal(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.06)', color: '#94A3B8', fontWeight: 900, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        </div>
                        {[
                            { id: 'wordQuiz',     label: '단어 퀴즈',   icon: '/assets/images/icons/words.webp',    desc: '한자 단어를 보고 뜻과 읽기를 맞춰보세요' },
                            { id: 'sentenceQuiz', label: '문장 퀴즈',   icon: '/assets/images/icons/sentence.webp', desc: '예문 속 빈칸을 채우며 문장을 익혀보세요' },
                        ].map(({ id, label, icon, desc }) => (
                            <button key={id} onClick={() => { setShowQuizModal(false); onNavigate(id); }}
                                className="w-full flex items-center gap-3 px-4 py-4 rounded-[1.2rem] active:scale-[0.97] transition-all"
                                style={{ background: 'rgba(124,131,255,0.05)', border: '1.5px solid rgba(124,131,255,0.15)' }}>
                                <div className="shrink-0 flex items-center justify-center" style={{ width: 40, height: 40 }}>
                                    <img src={icon} alt="" className="w-full h-full object-contain" />
                                </div>
                                <div className="flex flex-col items-start gap-0.5">
                                    <span style={{ fontSize: 15, fontWeight: 800, color: '#7C83FF' }}>{label}</span>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>{desc}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── 게임 선택 모달 ── */}
            {showGameModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setShowGameModal(false)}>
                    <div className="w-full max-w-lg flex flex-col gap-3 p-6 pb-10" style={{ background: '#fff', borderRadius: '2rem 2rem 0 0' }}
                        onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 style={{ fontSize: 17, fontWeight: 900, color: '#1A2B2A' }}>한자 게임</h3>
                            <button onClick={() => setShowGameModal(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.06)', color: '#94A3B8', fontWeight: 900, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        </div>
                        {[
                            { id: 'matchGame', label: '메모리 게임', icon: '/assets/images/icons/matching.webp', desc: '짝을 맞추며 한자와 뜻을 기억해보세요' },
                            { id: 'shootGame', label: '몬스터 슈팅', icon: '/assets/images/icons/monster.webp',  desc: '정답 한자를 쏘아 몬스터를 물리치세요' },
                        ].map(({ id, label, icon, desc }) => (
                            <button key={id} onClick={() => { setShowGameModal(false); onNavigate(id); }}
                                className="w-full flex items-center gap-3 px-4 py-4 rounded-[1.2rem] active:scale-[0.97] transition-all"
                                style={{ background: 'rgba(255,155,115,0.05)', border: '1.5px solid rgba(255,155,115,0.2)' }}>
                                <div className="shrink-0 flex items-center justify-center" style={{ width: 40, height: 40 }}>
                                    <img src={icon} alt="" className="w-full h-full object-contain" />
                                </div>
                                <div className="flex flex-col items-start gap-0.5">
                                    <span style={{ fontSize: 15, fontWeight: 800, color: '#FF9B73' }}>{label}</span>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>{desc}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── 단계 선택 모달 ── */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)' }}
                    onClick={() => setShowModal(false)}>
                    <div className="w-full max-w-lg flex flex-col p-6 pb-10 gap-6 shadow-2xl" style={{ background: '#ffffff', borderRadius: '2rem 2rem 0 0' }}
                        onClick={e => e.stopPropagation()}>
                        
                        <div className="flex items-center justify-between">
                            <h3 className="text-[19px] font-black tracking-tight text-slate-800">단계 선택</h3>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        {/* 전체 단계 복습 프리미엄 버튼 */}
                        <button
                            onClick={() => { setShowModal(false); showPremiumGate(); }}
                            className="w-full flex items-center justify-between p-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 hover:shadow-md active:scale-[0.98] transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <span className="font-extrabold text-indigo-900 tracking-tight text-[15px]">전체 단계 복습</span>
                            </div>
                            <span className="text-[11px] font-black px-2.5 py-1 rounded-md bg-indigo-600 text-white shadow-sm tracking-widest">PREMIUM</span>
                        </button>

                        {/* 급수 선택 */}
                        <div className="flex flex-col gap-2.5">
                            <p className="text-xs font-bold text-slate-400 tracking-wide">급수 선택</p>
                            <div className="flex flex-wrap gap-2">
                                {GRADES.map(({ label, firstStage, color }) => {
                                    const locked = !canAccessStage(firstStage);
                                    const sel = selectedGrade === label;
                                    return (
                                        <button
                                            key={label}
                                            onClick={() => locked ? showPremiumGate() : (onSelectGrade(sel ? null : label), setShowModal(false))}
                                            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-[14px] transition-all duration-300 active:scale-95 border group relative overflow-hidden ${
                                                sel 
                                                    ? 'text-white shadow-lg border-transparent' 
                                                    : locked 
                                                        ? 'bg-gradient-to-tr from-[#F8FAFC] to-[#F1F5F9] border-slate-200 text-slate-500 shadow-sm' 
                                                        : 'bg-white border-slate-100 text-slate-700 hover:border-slate-200 hover:bg-slate-50'
                                            }`}
                                            style={{
                                                background: sel ? color : locked ? 'linear-gradient(135deg, #F8FAFC 0%, #F5F3FF 100%)' : '',
                                                borderColor: locked ? '#EDE9FE' : sel ? color : '',
                                            }}
                                        >
                                            {locked && (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-[#A78BFA]">
                                                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            <span className={`font-extrabold text-[14px] tracking-tight ${locked ? 'text-[#6D28D9]/70' : ''}`}>{label}</span>
                                            {locked && (
                                                <span className="ml-1 text-[8.5px] font-black tracking-widest text-[#8B5CF6] bg-[#EDE9FE] px-1.5 py-0.5 rounded-md">
                                                    PRO
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 단계 선택 */}
                        <div className="flex flex-col gap-2.5">
                            <p className="text-xs font-bold text-slate-400 tracking-wide">단계 선택</p>
                            <div className="grid grid-cols-5 gap-2.5 overflow-y-auto pr-1 pb-2" style={{ maxHeight: '35vh' }}>
                            {Array.from({ length: Math.max(0, completedDay - 1) }, (_, i) => i + 1).map(n => {
                                const sel = selectedPastStage === n;
                                const locked = !canAccessStage(n);
                                return (
                                    <button key={n}
                                        onClick={() => locked ? showPremiumGate() : (onSelectPastStage(n), setShowModal(false))}
                                        className={`aspect-square rounded-[18px] flex flex-col items-center justify-center gap-1 transition-all duration-300 active:scale-95 border relative group ${
                                            sel 
                                                ? 'bg-[#2ED6C5] border-[#2ED6C5] text-white shadow-lg' 
                                                : locked 
                                                    ? 'shadow-sm border-[#EDE9FE]' 
                                                    : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                                        }`}
                                        style={{
                                            background: locked ? 'linear-gradient(135deg, #F8FAFC 0%, #F5F3FF 100%)' : sel ? '' : '',
                                        }}
                                    >
                                        {locked && (
                                            <div className="absolute top-2 right-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-[#A78BFA] drop-shadow-sm">
                                                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                        <span className={`text-[10px] font-bold tracking-wider ${locked ? 'text-[#8B5CF6]/60' : 'opacity-60'} transition-colors`}>단계</span>
                                        <span className={`text-[17px] font-black leading-none ${locked ? 'text-[#6D28D9]/70' : ''} transition-colors`}>{n}</span>
                                    </button>
                                );
                            })}
                            </div>
                        </div>

                        {(selectedPastStage || selectedGrade) && (
                            <button
                                onClick={() => {
                                    if (selectedPastStage) onSelectPastStage(null);
                                    if (selectedGrade) onSelectGrade(null);
                                    setShowModal(false);
                                }}
                                className="w-full py-3.5 mt-2 rounded-2xl border border-slate-200 text-slate-500 font-extrabold text-[14px] hover:bg-slate-50 active:scale-[0.98] transition-all"
                            >
                                선택 해제 (오늘의 탐험으로)
                            </button>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default MainMenuRenewal;
