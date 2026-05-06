/**
 * RankingsScreen.jsx
 * 실시간 랭킹 화면 (Supabase 연동 + Mock 폴백)
 *
 * Supabase 미설정 시: Mock 데이터로 자동 폴백
 * Supabase 설정 시: 실시간 업데이트 구독
 */

import { useMemo, useState, useEffect, useCallback } from 'react';
import { MOCK_USERS, getRankDetails } from '../utils/rankUtils.js';
import { isSupabaseEnabled, fetchLeaderboard, fetchMyRank, subscribeLeaderboard, getDeviceId } from '../lib/supabase.js';

const getMedal = (index) => {
    if (index === 0) return <span className="text-3xl md:text-4xl drop-shadow-lg">🥇</span>;
    if (index === 1) return <span className="text-3xl md:text-4xl drop-shadow-lg">🥈</span>;
    if (index === 2) return <span className="text-3xl md:text-4xl drop-shadow-lg">🥉</span>;
    return <span className="text-lg md:text-xl font-black text-slate-400 dark:text-slate-500">#{index + 1}</span>;
};

// 실시간 지시자 컴포넌트
const LiveIndicator = ({ isOnline }) => (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
        style={{
            background: isOnline ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.15)',
            border: `1px solid ${isOnline ? 'rgba(16,185,129,0.3)' : 'rgba(148,163,184,0.3)'}`,
        }}>
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
        <span className={`text-[10px] font-black ${isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
            {isOnline ? 'LIVE' : 'LOCAL'}
        </span>
    </div>
);

// 랭킹 행 컴포넌트
const RankRow = ({ user, index, isMe }) => {
    const rankInfo = getRankDetails(user.xp || 0, user.character_type || user.charType || 'garae', index + 1);

    return (
        <div
            className={`flex items-center p-3 md:p-4 rounded-3xl transition-all duration-300 ${
                isMe
                    ? 'scale-[1.02] z-10'
                    : 'hover:scale-[1.01]'
            }`}
            style={{
                background: isMe
                    ? 'linear-gradient(135deg, rgba(251,191,36,0.25) 0%, rgba(245,158,11,0.15) 100%)'
                    : 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(12px)',
                border: isMe
                    ? '2px solid rgba(251,191,36,0.5)'
                    : '1.5px solid rgba(255,255,255,0.8)',
                boxShadow: isMe
                    ? '0 4px 20px rgba(251,191,36,0.2), inset 0 1px 0 rgba(255,255,255,0.8)'
                    : '0 2px 12px rgba(99,102,241,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
            }}
        >
            {/* 순위 */}
            <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shrink-0">
                {getMedal(index)}
            </div>

            {/* 아바타 */}
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl ml-2 flex items-center justify-center shrink-0 overflow-hidden"
                style={{
                    background: 'rgba(255,255,255,0.8)',
                    border: '2px solid rgba(255,255,255,0.9)',
                    boxShadow: '0 2px 8px rgba(99,102,241,0.1)',
                }}>
                <img
                    src={rankInfo.avatar}
                    alt="avatar"
                    className="w-full h-full object-contain"
                    onError={(e) => { e.target.src = '/assets/images/characters/garae/rank_1.webp'; }}
                />
            </div>

            {/* 이름 + 레벨 */}
            <div className="ml-3 flex-1 flex flex-col min-w-0">
                <span className={`font-black text-sm md:text-base truncate ${
                    isMe ? 'text-amber-800 dark:text-amber-200' : 'text-slate-700 dark:text-slate-100'
                }`}>
                    {user.nickname || user.name || '학습자'}{isMe && ' 👈'}
                </span>
                <span className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500">
                    LV.{rankInfo.level} · {rankInfo.name}
                    {user.streak_count > 0 && (
                        <span className="ml-1 text-orange-400">🔥{user.streak_count}</span>
                    )}
                </span>
            </div>

            {/* XP */}
            <div className={`font-black text-base md:text-lg tracking-tighter ${
                isMe ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-500 dark:text-indigo-400'
            }`}>
                {(user.xp || 0).toLocaleString()}
                <span className="text-[10px] font-bold text-slate-400 ml-1">XP</span>
            </div>
        </div>
    );
};

const RankingsScreen = ({ onBack, userXp, selectedCharacter, userNickname }) => {
    const [cloudLeaderboard, setCloudLeaderboard] = useState(null);
    const [cloudMyRank, setCloudMyRank] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const deviceId = getDeviceId();

    // Mock 데이터 기반 리더보드 (폴백)
    const mockLeaderboard = useMemo(() => {
        const me = {
            id: 'me',
            nickname: userNickname || '나',
            xp: userXp || 0,
            isMe: true,
            character_type: selectedCharacter || 'garae',
            streak_count: 0,
        };
        return [...MOCK_USERS.map(u => ({
            ...u,
            nickname: u.name,
            character_type: u.charType,
            streak_count: Math.floor(Math.random() * 10),
        })), me].sort((a, b) => b.xp - a.xp).slice(0, 50);
    }, [userXp, selectedCharacter, userNickname]);

    const mockMyPosition = useMemo(() => {
        const all = [...MOCK_USERS, { xp: userXp || 0 }].sort((a, b) => b.xp - a.xp);
        return all.findIndex(u => u.xp <= (userXp || 0)) + 1;
    }, [userXp]);

    // Supabase 리더보드 로드
    const loadCloudLeaderboard = useCallback(async () => {
        if (!isSupabaseEnabled) return;
        setIsLoading(true);
        try {
            const { data } = await fetchLeaderboard();
            if (data) {
                const withMe = data.map(u => ({ ...u, isMe: u.device_id === deviceId }));
                // 내가 없으면 추가
                const meInList = withMe.some(u => u.isMe);
                if (!meInList) {
                    withMe.push({
                        device_id: deviceId,
                        nickname: userNickname || '나',
                        xp: userXp || 0,
                        character_type: selectedCharacter || 'garae',
                        streak_count: 0,
                        isMe: true,
                    });
                    withMe.sort((a, b) => b.xp - a.xp);
                }
                setCloudLeaderboard(withMe.slice(0, 50));
                setLastUpdated(new Date());
            }
            const { rank } = await fetchMyRank(userXp || 0);
            if (rank) setCloudMyRank(rank);
        } catch (e) {
            console.warn('[Rankings] Cloud load failed:', e);
        } finally {
            setIsLoading(false);
        }
    }, [userXp, selectedCharacter, userNickname, deviceId]);

    useEffect(() => {
        loadCloudLeaderboard();
        // 실시간 구독
        const unsubscribe = subscribeLeaderboard(() => {
            loadCloudLeaderboard();
        });
        return unsubscribe;
    }, [loadCloudLeaderboard]);

    const leaderboard = cloudLeaderboard || mockLeaderboard;
    const myPosition = cloudMyRank || mockMyPosition;
    const isLive = !!cloudLeaderboard;

    return (
        <div className="fixed inset-0 w-full h-full z-50 flex flex-col items-center overflow-y-auto aesthetic-space-bg">
            <div className="w-full max-w-lg mx-auto flex flex-col relative z-10 px-4 pt-4 pb-20 safe-top">

                {/* 헤더 */}
                <div className="flex justify-between items-center mb-4 clay-panel !rounded-[2rem] p-4">
                    <button
                        onClick={onBack}
                        className="clay-button px-4 py-2.5 rounded-2xl flex items-center gap-2 text-slate-600 dark:text-slate-300 font-black active:scale-95"
                    >
                        <span className="text-lg">←</span>
                        <span className="text-sm">뒤로</span>
                    </button>
                    <div className="flex items-center gap-2 flex-1 justify-center">
                        <span className="text-2xl">🏆</span>
                        <h2 className="text-2xl font-black text-slate-700 dark:text-white">랭킹</h2>
                        <LiveIndicator isOnline={isLive} />
                    </div>
                    <button
                        onClick={loadCloudLeaderboard}
                        className="clay-button w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 active:scale-95"
                        title="새로고침"
                    >
                        <span className={`text-lg ${isLoading ? 'animate-spin' : ''}`}>↻</span>
                    </button>
                </div>

                {/* 내 순위 배너 */}
                <div className="mb-4 p-4 rounded-3xl flex items-center gap-4"
                    style={{
                        background: 'linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(245,158,11,0.1) 100%)',
                        backdropFilter: 'blur(16px)',
                        border: '2px solid rgba(251,191,36,0.4)',
                        boxShadow: '0 4px 20px rgba(251,191,36,0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
                    }}>
                    <div className="flex flex-col items-center">
                        <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
                            #{myPosition}
                        </span>
                        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">순위</span>
                    </div>
                    <div className="w-px h-10 bg-amber-300/50" />
                    <div className="flex-1">
                        <div className="font-black text-amber-800 dark:text-amber-200 text-sm">
                            {userNickname || '나'}
                        </div>
                        <div className="text-amber-600 dark:text-amber-400 font-bold text-xs">
                            {(userXp || 0).toLocaleString()} XP
                        </div>
                    </div>
                    {lastUpdated && (
                        <div className="text-[9px] text-amber-500 font-bold text-right">
                            {lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 업데이트
                        </div>
                    )}
                </div>

                {/* 로딩 상태 */}
                {isLoading && (
                    <div className="text-center py-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl"
                            style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)' }}>
                            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-bold text-slate-500">실시간 데이터 로딩 중...</span>
                        </div>
                    </div>
                )}

                {/* 리더보드 */}
                <div className="flex flex-col gap-2">
                    {leaderboard.map((user, index) => (
                        <RankRow
                            key={user.device_id || user.id || index}
                            user={user}
                            index={index}
                            isMe={user.isMe || false}
                        />
                    ))}
                </div>

                {/* 오프라인 안내 */}
                {!isSupabaseEnabled && (
                    <div className="mt-4 p-3 rounded-2xl text-center"
                        style={{
                            background: 'rgba(255,255,255,0.5)',
                            backdropFilter: 'blur(12px)',
                            border: '1.5px solid rgba(148,163,184,0.3)',
                        }}>
                        <p className="text-xs text-slate-400 font-bold">
                            💡 Supabase 연동 시 실시간 랭킹을 확인할 수 있습니다
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RankingsScreen;
