import { useState, useMemo } from 'react';
import { SK } from '../constants/storageKeys.js';
import HANJA_DATA from '../hanja_unified.json';
import { wordById } from '../utils/wordUtils.js';

const hanjaById = Object.fromEntries(HANJA_DATA.map(h => [h.id, h]));

const RankingsScreen = ({ onBack, isDarkMode }) => {
    const [hanjaOpen, setHanjaOpen] = useState(false);
    const [wordsOpen, setWordsOpen] = useState(false);

    const studyLogDays = useMemo(() => {
        try {
            const raw = JSON.parse(localStorage.getItem(SK.STUDY_LOG) || '{}');
            return raw.days || {};
        } catch { return {}; }
    }, []);

    const studyLogTotal = useMemo(() => {
        try {
            const raw = JSON.parse(localStorage.getItem(SK.STUDY_LOG) || '{}');
            return raw.total || {};
        } catch { return {}; }
    }, []);

    const missionHistory = useMemo(() => {
        try { return JSON.parse(localStorage.getItem(SK.MISSION_HISTORY) || '{}'); } catch { return {}; }
    }, []);

    const stats = useMemo(() => {
        const allHanjaIds = new Set();
        const allWordIds = new Set();
        const allCorrect = new Set();
        const allWrong = new Set();
        let studyDays = 0;

        const allLoggedDays = new Set([
            ...Object.keys(studyLogDays),
            ...Object.keys(missionHistory)
        ]);

        allLoggedDays.forEach(ds => {
            const entry = studyLogDays[ds] || {};
            const hasMission = missionHistory && missionHistory[ds] && missionHistory[ds].length > 0;
            const hasActivity = hasMission || (
                (entry.hanjaIds?.length > 0) ||
                (entry.wordIds?.length > 0) ||
                (entry.correctWordIds?.length > 0) ||
                (entry.wrongWordIds?.length > 0)
            );
            if (hasActivity) studyDays++;
            (entry.hanjaIds || []).forEach(id => allHanjaIds.add(id));
            (entry.wordIds || []).forEach(id => allWordIds.add(id));
            (entry.correctWordIds || []).forEach(id => allCorrect.add(id));
            (entry.wrongWordIds || []).forEach(id => allWrong.add(id));
        });
        const accuracy = (allCorrect.size + allWrong.size) > 0
            ? Math.round((allCorrect.size / (allCorrect.size + allWrong.size)) * 100) : null;
        const totalActivities =
            (studyLogTotal.matchGame || 0) + (studyLogTotal.shootGame || 0) +
            (studyLogTotal.wordQuiz || 0) + (studyLogTotal.sentenceQuiz || 0) +
            (studyLogTotal.writing || 0);
        const hanjaList = [...allHanjaIds].map(id => hanjaById[id]).filter(Boolean);
        const wordList = [...allWordIds].map(id => wordById[id]).filter(Boolean);
        return { hanjaList, wordList, wrongWordIds: allWrong, studyDays, accuracy, totalActivities };
    }, [studyLog, totalActivity, missionHistory]);

    return (
        <div className={`fixed inset-0 w-full h-full z-50 flex flex-col items-center overflow-y-auto ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-[#F7FAF9] text-[#3D3530]'}`}>
            <div className="w-full max-w-lg mx-auto flex flex-col relative z-10 px-4 pt-4 pb-20 safe-top">
                {/* 헤더 */}
                <div className="w-full shrink-0 safe-top pt-4 px-4 mb-6">
                    <div className={`flex items-center justify-between rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border w-full ${isDarkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-white'} backdrop-blur-md`}>
                        <button onClick={onBack}
                            className={`flex items-center justify-center border-2 rounded-2xl shadow-lg active:scale-95 transition-all px-3 py-2 font-black gap-1 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-white text-[#5B677A]'}`}>
                            ←
                        </button>
                        <div className="flex items-center gap-2 overflow-hidden">
                            <h2 className={`text-lg font-black m-0 ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>단어장</h2>
                        </div>
                        <div className="w-10 h-10" />
                    </div>
                </div>

                {/* 누적 미니 통계 뷰 */}
                <div className="px-5 pb-6 pt-2 flex flex-col gap-6">
                    <div className="flex flex-col gap-4">

                        {/* 학습한 한자어 */}
                        <div className={`rounded-[1.8rem] overflow-hidden shadow-md border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-[#D6F5F0]/50'}`}>
                            <button onClick={() => setHanjaOpen(v => !v)}
                                className="w-full flex items-center justify-between px-5 py-4 active:opacity-75 transition-opacity">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-[#E8FAF7] border-[#D6F5F0]/30'}`}>
                                        <img src="/assets/images/icons/study.png" className="w-7 h-7 object-contain" alt="학습한 한자어" />
                                    </div>
                                    <span className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-[#3D3530]'}`}>학습한 한자어</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="text-xl font-black text-[#00C7AE] font-['Outfit']">{stats.hanjaList.length}</span>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 shadow-md transition-all ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-white text-[#5B677A]'}`}>
                                        <span className="text-[9px] font-black">{hanjaOpen ? '▲' : '▼'}</span>
                                    </div>
                                </div>
                            </button>
                            {hanjaOpen && (
                                <div className={`px-5 pb-5 pt-2 border-t ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-[#F0FAF8]/60 bg-white'} animate-in fade-in slide-in-from-top-1 duration-200`}>
                                    {stats.hanjaList.length === 0
                                        ? <p className="text-xs text-[#B0B8C4] font-black text-center py-4">아직 학습한 한자어가 없어요</p>
                                        : <div className="flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto pr-1">
                                            {stats.hanjaList.map(h => (
                                                <span key={h.id} className={`px-3 py-2 rounded-2xl text-xs font-extrabold shadow-sm whitespace-nowrap ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-[#F4F6F8]/70 text-[#5D677A]'}`}>
                                                    <span className="text-sm font-extrabold mr-1.5">{h.hanja}</span>
                                                    <span className={isDarkMode ? 'text-slate-400' : 'text-[#AEB7C5]'}>{h.sound}</span>
                                                </span>
                                            ))}
                                        </div>
                                    }
                                </div>
                            )}
                        </div>

                        {/* 학습한 단어 */}
                        <div className={`rounded-[1.8rem] overflow-hidden shadow-md border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-[#FFD8D2]/50'}`}>
                            <button onClick={() => setWordsOpen(v => !v)}
                                className="w-full flex items-center justify-between px-5 py-4 active:opacity-75 transition-opacity">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-[#FFF2F0] border-[#FFD8D2]/30'}`}>
                                        <img src="/assets/images/icons/writing.png" className="w-7 h-7 object-contain" alt="학습한 단어" />
                                    </div>
                                    <span className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-[#3D3530]'} whitespace-nowrap`}>학습한 단어</span>
                                    {stats.wrongWordIds.size > 0 && (
                                        <span className="text-[10px] font-black text-[#FF5C4D] bg-[#FFF0EE] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                                            틀린 적 {stats.wrongWordIds.size}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="text-xl font-black text-[#FF8D7E] font-['Outfit']">{stats.wordList.length}</span>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 shadow-md transition-all ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-white text-[#5B677A]'}`}>
                                        <span className="text-[9px] font-black">{wordsOpen ? '▲' : '▼'}</span>
                                    </div>
                                </div>
                            </button>
                            {wordsOpen && (
                                <div className={`px-5 pb-5 pt-2 border-t ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-[#FFF5F3] bg-white'} animate-in fade-in slide-in-from-top-1 duration-200`}>
                                    {stats.wordList.length === 0
                                        ? <p className="text-xs text-[#B0B8C4] font-extrabold text-center py-4">아직 학습한 단어가 없어요</p>
                                        : <div className="flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto pr-1">
                                            {stats.wordList.map(w => {
                                                const hasWrong = stats.wrongWordIds.has(w.id);
                                                return (
                                                    <span key={w.id} className={`px-3 py-2 rounded-2xl text-xs font-extrabold shadow-sm whitespace-nowrap ${
                                                        hasWrong
                                                            ? isDarkMode
                                                                ? 'bg-[#FF3B30]/10 text-red-300 border border-[#FF453A]/20'
                                                                : 'bg-[#FFF0EE]/50 text-[#CC5544] border border-[#FFD4CC]/50'
                                                            : isDarkMode
                                                                ? 'bg-slate-800 text-slate-300'
                                                                : 'bg-[#F4F6F8]/70 text-[#5D677A]'
                                                    }`}>
                                                        {w.word} <span className={hasWrong ? 'text-red-400/80' : (isDarkMode ? 'text-slate-400' : 'text-[#AEB7C5]')}>{w.reading}</span>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    }
                                </div>
                            )}
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default RankingsScreen;
