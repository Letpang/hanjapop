import { useState } from 'react';
import { SK } from '../constants/storageKeys.js';

const Toggle = ({ value, onToggle }) => (
    <button
        onClick={onToggle}
        className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center px-0.5 shrink-0 ${value ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
    >
        <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
);

const Row = ({ label, sub, children }) => (
    <div className="flex items-center justify-between gap-3 py-0.5">
        <div className="flex flex-col min-w-0">
            <span className="text-sm font-black text-slate-700 dark:text-slate-200 leading-tight">{label}</span>
            {sub && <span className="text-xs font-bold text-slate-400 dark:text-slate-500 leading-tight mt-0.5">{sub}</span>}
        </div>
        <div className="shrink-0">{children}</div>
    </div>
);

const Section = ({ title, color, children }) => (
    <div className="flex flex-col gap-2.5">
        <p className="text-xs font-black tracking-tight opacity-70" style={{ color }}>{title}</p>
        <div className="bg-white dark:bg-slate-800/80 rounded-[1.4rem] px-5 py-4 flex flex-col gap-4 border border-slate-100 dark:border-slate-700/40 shadow-sm">
            {children}
        </div>
    </div>
);

const Divider = () => <div className="h-px bg-slate-100 dark:bg-slate-700/50" />;

const CHARACTERS = [
    { id: 'garae',    label: '가래', image: '/assets/images/characters/garae/rank_5.webp' },
    { id: 'jeolmi',   label: '절미', image: '/assets/images/characters/jeolmi/rank_5.webp' },
    { id: 'chapssal', label: '찹쌀', image: '/assets/images/characters/chapssal/rank_5.webp' },
    { id: 'muzi',     label: '무지', image: '/assets/images/characters/muzi/rank_5.webp' },
];

const SettingsScreen = ({ onBack, isDarkMode, setIsDarkMode, userNickname, setUserNickname, selectedCharacter, setSelectedCharacter, restoreFromCloud, isRestoring }) => {
    const [tempNickname, setTempNickname] = useState(userNickname || '');
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [restoreMsg, setRestoreMsg] = useState(null);

    const handleRestore = async () => {
        if (!restoreFromCloud) return;
        const { success } = await restoreFromCloud();
        if (success) {
            setRestoreMsg('복원 완료! 재시작합니다...');
            setTimeout(() => window.location.reload(), 1200);
        } else {
            setRestoreMsg('복원할 데이터가 없습니다. (백업이 없거나 오프라인 상태)');
            setTimeout(() => setRestoreMsg(null), 3000);
        }
    };

    const handleSaveNickname = () => {
        if (!tempNickname.trim()) return;
        setUserNickname(tempNickname.trim());
        localStorage.setItem(SK.SETTINGS_NICKNAME, tempNickname.trim());
        alert('닉네임이 저장되었습니다!');
    };

    return (
        <div className="bg-[#FDFBF7] dark:bg-slate-950 min-h-screen w-full flex flex-col">

            {/* Header */}
            <div className="sticky top-0 z-50 w-full flex items-center gap-3 px-4 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg">
                <button
                    onClick={onBack}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 active:scale-90 transition-all"
                >
                    <span className="text-slate-500 dark:text-slate-300 text-base font-black">←</span>
                </button>
                <h1 className="font-black text-xl text-slate-800 dark:text-slate-100 tracking-tight">설정</h1>
            </div>

            <div className="w-full max-w-md md:max-w-2xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-5 safe-bottom">

                {/* 화면 */}
                <Section title="화면" color="#5C9DC0">
                    <Row label="다크 모드" sub="어두운 화면으로 전환">
                        <Toggle value={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} />
                    </Row>
                </Section>

                {/* 프로필 */}
                <Section title="프로필" color="#45A081">
                    <div className="flex flex-col gap-3">
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200">닉네임 변경</span>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={tempNickname}
                                onChange={(e) => setTempNickname(e.target.value)}
                                placeholder="새 닉네임 입력"
                                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm outline-none transition-all bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-indigo-500"
                            />
                            <button
                                onClick={handleSaveNickname}
                                className="px-4 py-2.5 bg-indigo-500 text-white font-black rounded-xl active:scale-95 transition-all text-sm shadow-md"
                            >
                                저장
                            </button>
                        </div>
                    </div>
                    {setSelectedCharacter && (
                        <>
                            <Divider />
                            <div className="flex flex-col gap-3">
                                <span className="text-xs font-black text-slate-700 dark:text-slate-200">캐릭터 변경</span>
                                <div className="grid grid-cols-4 gap-2">
                                    {CHARACTERS.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => { setSelectedCharacter(c.id); localStorage.setItem(SK.SELECTED_CHARACTER, c.id); }}
                                            className={`flex flex-col items-center justify-between gap-1 py-2 rounded-2xl border-2 transition-all active:scale-95 h-[90px] ${
                                                selectedCharacter === c.id
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                                                    : 'border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50'
                                            }`}
                                        >
                                            <img src={c.image} alt={c.label} className="object-contain" style={{ width: c.id === 'chapssal' ? '60px' : '40px', height: c.id === 'chapssal' ? '60px' : '40px', marginTop: c.id === 'chapssal' ? '-10px' : '0' }} />
                                            <span className={`text-[10px] font-black ${selectedCharacter === c.id ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>{c.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </Section>

                {/* 데이터 */}
                <Section title="데이터" color="#94A3B8">
                    {restoreFromCloud && (
                        <>
                            <button
                                onClick={handleRestore}
                                disabled={isRestoring}
                                className="w-full py-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 font-black text-sm active:scale-95 transition-all border border-indigo-100 dark:border-indigo-800/30 disabled:opacity-50"
                            >
                                {isRestoring ? '복원 중...' : '클라우드에서 복원하기'}
                            </button>
                            {restoreMsg && (
                                <p className="text-xs font-bold text-center text-slate-400 dark:text-slate-500 -mt-2">{restoreMsg}</p>
                            )}
                            <Divider />
                        </>
                    )}
                    <button
                        onClick={() => setShowResetConfirm(true)}
                        className="w-full py-3.5 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 font-black text-sm active:scale-95 transition-all border border-rose-100 dark:border-rose-800/30"
                    >
                        데이터 초기화
                    </button>
                </Section>

                <p className="text-center text-xs text-slate-300 dark:text-slate-700 font-bold pt-2">Hanja Pop v1.0.0</p>
            </div>

            {/* 초기화 확인 모달 */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                    <div className="clay-panel p-8 max-w-sm w-full text-center flex flex-col gap-5 bg-white dark:bg-slate-800 rounded-3xl shadow-xl">
                        <div className="w-16 h-16 mx-auto">
                            <img src="/assets/images/characters/garae/rank_5.webp" className="w-full h-full object-contain" alt="" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xl mb-1">정말로 초기화할까요?</h3>
                            <p className="text-slate-400 text-sm font-bold">모든 학습 기록이 삭제됩니다.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { window.localStorage.clear(); window.location.reload(); }}
                                className="flex-1 py-3 rounded-2xl font-black text-white bg-rose-500 border border-rose-600 active:scale-95 transition-all shadow-md"
                            >
                                초기화하기
                            </button>
                            <button
                                onClick={() => setShowResetConfirm(false)}
                                className="flex-1 py-3 rounded-2xl font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 active:scale-95 transition-all"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsScreen;
