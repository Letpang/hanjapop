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
    return <span className="text-lg md:text-xl font-extrabold text-[#AEB7C5] dark:text-[#5B677A]">#{index + 1}</span>;
};

// 실시간 지시자 컴포넌트
const LiveIndicator = ({ isOnline }) => (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
        style={{
            background: isOnline ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.15)',
            border: `1px solid ${isOnline ? 'rgba(16,185,129,0.3)' : 'rgba(148,163,184,0.3)'}`,
        }}>
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#FF9B73] animate-pulse' : 'bg-slate-400'}`} />
        <span className={`text-xs font-extrabold ${isOnline ? 'text-[#FF9B73] dark:text-[#FF9B73]' : 'text-[#AEB7C5]'}`}>
            {isOnline ? 'LIVE' : 'LOCAL'}
        </span>
    </div>
);

// 랭킹 행 컴포넌트
const RankRow = ({ user, index, isMe }) => {
    const rankInfo = getRankDetails(user.xp || 0, user.character_type || user.charType || 'garae', index + 1);

    return (
        <div
            className={`flex items-center p-3 md:p-4 rounded-3xl transition-all duration-300 bg-white border border-[#E9EDF2] shadow-lg shadow-slate-100/50 ${
                isMe ? 'ring-2 ring-[#FFB433] ring-offset-2' : ''
            }`}
        >
            {/* 순위 */}
            <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shrink-0">
                {getMedal(index)}
            </div>

            {/* 아바타 */}
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl ml-2 flex items-center justify-center shrink-0 overflow-hidden bg-[#F8FAF9] border border-[#E9EDF2] shadow-sm">
                <img
                    src={rankInfo.avatar}
                    alt="avatar"
                    className="w-full h-full object-contain"
                    onError={(e) => { e.target.src = '/assets/images/characters/garae/rank_1.webp'; }}
                />
            </div>

            {/* 이름 + 레벨 */}
            <div className="ml-3 flex-1 flex flex-col min-w-0">
                <span className={`font-extrabold text-sm md:text-base truncate ${
                    isMe ? 'text-[#8B5E00] dark:text-[#FFB433]/25' : 'text-slate-700 dark:text-slate-100'
                }`}>
                    {user.nickname || user.name || '학습자'}{isMe && ' 👈'}
                </span>
                <span className="text-xs md:text-xs font-bold text-[#AEB7C5] dark:text-[#5B677A]">
                    LV.{rankInfo.level} · {rankInfo.name}
                    {user.streak_count > 0 && (
                        <div className="flex items-center gap-1 bg-[#FFB433]/10 px-2 py-0.5 rounded-lg border border-[#FFB433]/15">
                            <span className="streak-badge text-[#FFB433] text-xs">✦</span>
                            <span className="text-xs font-extrabold text-[#FFB433]">{user.streak_count}</span>
                        </div>
                    )}
                </span>
            </div>

            {/* XP */}
            <div className={`font-extrabold text-base md:text-lg tracking-tighter ${
                isMe ? 'text-[#FFB433] dark:text-[#FFB433]' : 'text-[#7C83FF] dark:text-[#7C83FF]'
            }`}>
                {(user.xp || 0).toLocaleString()}
                <span className="text-xs font-bold text-[#AEB7C5] ml-1">XP</span>
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
        <div className="fixed inset-0 w-full h-full z-50 flex flex-col items-center overflow-y-auto bg-[#F7FAF9]">
            <div className="w-full max-w-lg mx-auto flex flex-col relative z-10 px-4 pt-4 pb-20 safe-top">

                {/* 헤더 */}
                <div className="w-full shrink-0 safe-top pt-4 px-4 mb-2">
                    <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
                        <button onClick={onBack}
                            className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-lg active:scale-95 transition-all px-3 py-2 font-black text-[#5B677A] gap-1">
                            <span>←</span><span className="ml-1">뒤로</span>
                        </button>
                        <div className="flex items-center gap-2 overflow-hidden">
                            <h2 className="text-lg font-black text-slate-700 m-0">랭킹</h2>
                            <LiveIndicator isOnline={isLive} />
                        </div>
                        <button
                            onClick={loadCloudLeaderboard}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-[#AEB7C5] hover:text-[#7C83FF] transition-colors ${isLoading ? 'animate-spin' : ''}`}
                        >
                            <span className="text-lg font-extrabold">↻</span>
                        </button>
                    </div>
                </div>

                {/* 내 순위 배너 */}
                <div className="mb-6 p-6 rounded-[2.5rem] flex items-center gap-6 bg-white border border-[#E9EDF2] shadow-xl shadow-slate-100/50 ring-2 ring-[#FFB433] ring-offset-2">
                    <div className="flex flex-col items-center">
                        <span className="text-4xl font-extrabold text-[#FFB433] tracking-tighter">
                            #{myPosition}
                        </span>
                        <span className="text-xs font-extrabold text-[#AEB7C5] uppercase tracking-[0.2em]">Rank</span>
                    </div>
                    <div className="w-px h-10 bg-[#F4F7F8]" />
                    <div className="flex-1">
                        <div className="font-extrabold text-[#5D544F] text-lg tracking-tight uppercase">
                            {userNickname || '나'}
                        </div>
                        <div className="text-[#7C83FF] font-bold text-xs">
                            {(userXp || 0).toLocaleString()} XP
                        </div>
                    </div>
                    {lastUpdated && (
                        <div className="text-xs text-[#AEB7C5] font-extrabold uppercase tracking-widest text-right">
                            {lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    )}
                </div>

                {/* 로딩 상태 */}
                {isLoading && (
                    <div className="text-center py-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl"
                            style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)' }}>
                            <div className="w-4 h-4 border-2 border-[#7C83FF] border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-bold text-[#5B677A]">실시간 데이터 로딩 중...</span>
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
                    <div className="mt-6 p-4 rounded-3xl text-center bg-white border border-[#E9EDF2] shadow-sm">
                        <p className="text-xs text-[#AEB7C5] font-extrabold uppercase tracking-[0.2em]">
                            💡 Sync with Supabase for Live Rankings
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RankingsScreen;
