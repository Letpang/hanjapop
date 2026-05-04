import { useMemo } from 'react';
import { MOCK_USERS, getRankDetails } from '../utils/rankUtils.js';

const RankingsScreen = ({ onBack, userXp, selectedCharacter }) => {
    const leaderboard = useMemo(() => {
        const me = { id: 'me', name: '나', xp: userXp || 0, isMe: true, charType: selectedCharacter || 'eunha' };
        return [...MOCK_USERS, me].sort((a, b) => b.xp - a.xp).slice(0, 50);
    }, [userXp, selectedCharacter]);

    const myPosition = useMemo(() => {
        const all = [...MOCK_USERS, { xp: userXp || 0 }].sort((a, b) => b.xp - a.xp);
        return all.findIndex(u => u.xp <= (userXp || 0)) + 1;
    }, [userXp]);

    const getMedal = (index) => {
        if (index === 0) return <span className="text-4xl md:text-5xl drop-shadow-md">🥇</span>;
        if (index === 1) return <span className="text-4xl md:text-5xl drop-shadow-md">🥈</span>;
        if (index === 2) return <span className="text-4xl md:text-5xl drop-shadow-md">🥉</span>;
        return <span className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-black">#{index + 1}</span>;
    };

    return (
        <div className="fixed inset-0 w-full h-full z-50 flex flex-col items-center overflow-y-auto"
             style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #faf5ff 100%)' }}>
            <div className="dark-mode:bg-slate-900 w-full max-w-lg mx-auto flex flex-col relative z-10 px-4 pt-4 pb-20 safe-top">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 clay-panel !rounded-[2rem] p-4 border-4 border-white dark:border-slate-700">
                    <button onClick={onBack} className="text-slate-600 dark:text-slate-300 font-black bg-white/60 dark:bg-slate-800/60 px-5 py-2.5 rounded-2xl border-2 border-white/50 shadow-md hover:bg-white active:scale-95 transition-all flex items-center gap-2">
                        <span className="text-xl">←</span> <span>뒤로</span>
                    </button>
                    <div className="flex items-center gap-3 flex-1 justify-center pr-4">
                        <span className="text-3xl">🏆</span>
                        <h2 className="text-3xl font-black text-slate-700 dark:text-white tracking-tight">랭킹</h2>
                    </div>
                </div>

                {/* My rank banner */}
                <div className="clay-panel !rounded-[2rem] p-4 mb-6 border-4 border-amber-300 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/30 flex items-center gap-4">
                    <span className="text-3xl font-black text-amber-600 dark:text-amber-400">#{myPosition}</span>
                    <div className="w-px h-10 bg-amber-200 dark:bg-amber-700"></div>
                    <div className="flex flex-col">
                        <span className="text-amber-800 dark:text-amber-300 font-black text-sm">내 순위</span>
                        <span className="text-amber-700 dark:text-amber-400 font-bold text-xs">XP {userXp || 0}점</span>
                    </div>
                    <div className="ml-auto">
                        <img
                            src={`/assets/images/characters/${selectedCharacter === 'uju' ? 'uju' : 'eunha'}.png`}
                            alt="me"
                            className="w-12 h-12 object-contain"
                        />
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="flex flex-col gap-3">
                    {leaderboard.map((user, index) => {
                        const rankInfo = getRankDetails(user.xp, user.charType, index + 1);
                        return (
                            <div
                                key={user.id}
                                className={"flex items-center p-3 md:p-4 rounded-[2rem] border-4 shadow-md transition-transform " +
                                    (user.isMe
                                        ? "bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-500 scale-[1.02] z-10"
                                        : "bg-white dark:bg-slate-800/80 border-white dark:border-slate-700")}
                            >
                                <div className="w-12 h-12 flex items-center justify-center shrink-0">
                                    {getMedal(index)}
                                </div>

                                <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 ml-2 flex items-center justify-center shrink-0 overflow-hidden">
                                    <img src={rankInfo.avatar} alt="avatar" className="w-[110%] h-[110%] object-contain" />
                                </div>

                                <div className="ml-3 flex-1 flex flex-col min-w-0">
                                    <span className={"font-black text-base truncate " + (user.isMe ? "text-amber-900 dark:text-amber-200" : "text-slate-700 dark:text-slate-100")}>
                                        {user.name}{user.isMe && " (나)"}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400 dark:text-slate-400">
                                        LV.{rankInfo.level} {rankInfo.name}
                                    </span>
                                </div>

                                <div className={"font-black text-lg tracking-tighter " + (user.isMe ? "text-amber-700 dark:text-amber-400" : "text-indigo-500 dark:text-indigo-400")}>
                                    {user.xp.toLocaleString()}
                                    <span className="text-xs font-bold text-slate-400 ml-1">XP</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default RankingsScreen;
