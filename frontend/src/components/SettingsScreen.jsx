import { useState } from 'react';
import { SK } from '../constants/storageKeys.js';

const Toggle = ({ value, onToggle }) => (
    <button
        onClick={onToggle}
        className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center px-0.5 shrink-0 ${value ? 'bg-[#7C83FF]' : 'bg-slate-200'}`}
    >
        <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
);

const VolumeSlider = ({ value, onChange, color }) => (
    <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-24 h-2 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: '#7C83FF' }}
    />
);

const Row = ({ label, sub, children, isDarkMode }) => (
    <div className="flex items-center justify-between gap-3 py-0.5">
        <div className="flex flex-col min-w-0">
            <span className={`text-sm font-extrabold leading-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{label}</span>
            {sub && <span className="text-xs font-bold text-[#AEB7C5] leading-tight mt-0.5">{sub}</span>}
        </div>
        <div className="shrink-0">{children}</div>
    </div>
);

const Divider = ({ isDarkMode }) => (
    <div className={`h-px ${isDarkMode ? 'bg-slate-700/50' : 'bg-[#F4F7F8]'}`} />
);

const Section = ({ title, color, children, isDarkMode }) => (
    <div className="flex flex-col gap-2.5">
        <p className="text-xs font-extrabold tracking-tight" style={{ color: '#7C83FF' }}>{title}</p>
        <div className={`rounded-[1.4rem] px-5 py-4 flex flex-col gap-4 shadow-sm ${isDarkMode ? 'bg-slate-800/80 border border-slate-700/40' : 'bg-white border border-[#E9EDF2]'}`}>
            {children}
        </div>
    </div>
);

const CHARACTERS = [
    { id: 'garae',    label: '가래', image: '/assets/images/characters/garae/rank_1.webp' },
    { id: 'jeolmi',   label: '절미', image: '/assets/images/characters/jeolmi/rank_1.webp' },
    { id: 'chapssal', label: '찹쌀', image: '/assets/images/characters/chapssal/rank_1.webp' },
    { id: 'muzi',     label: '무지', image: '/assets/images/characters/muzi/rank_1.webp' },
];

const SettingsScreen = ({ onBack, isDarkMode, setIsDarkMode, userNickname, setUserNickname, selectedCharacter, setSelectedCharacter, restoreFromCloud, isRestoring }) => {
    const [tempNickname, setTempNickname] = useState(userNickname || '');
    const [bgmOn, setBgmOn] = useState(() => localStorage.getItem(SK.BGM_ON) !== 'false');
    const [sfxOn, setSfxOn] = useState(() => localStorage.getItem(SK.SFX_ON) !== 'false');
    const [bgmVolume, setBgmVolume] = useState(() => parseInt(localStorage.getItem(SK.BGM_VOLUME) ?? '70', 10));
    const [sfxVolume, setSfxVolume] = useState(() => parseInt(localStorage.getItem(SK.SFX_VOLUME) ?? '80', 10));
    const [vibration, setVibration] = useState(() => localStorage.getItem(SK.VIBRATION) !== 'false');
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

    const set = (key, val, setter) => {
        setter(val);
        localStorage.setItem(key, val);
    };

    const handleSaveNickname = () => {
        if (!tempNickname.trim()) return;
        setUserNickname(tempNickname.trim());
        localStorage.setItem(SK.SETTINGS_NICKNAME, tempNickname.trim());
        alert('닉네임이 저장되었습니다!');
    };

    return (
        <div className={`min-h-screen w-full flex flex-col ${isDarkMode ? 'bg-slate-950' : 'bg-[#F7FAF9]'}`}>

            {/* 헤더 */}
            <div className="w-full shrink-0 safe-top pt-4 px-4 mb-2">
                <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
                    <button onClick={onBack}
                        className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-lg active:scale-95 transition-all px-3 py-2 font-black text-[#7C83FF] gap-1">
                        ←
                    </button>
                    <div className="flex items-center gap-2 overflow-hidden">
                        <h2 className="text-lg font-black text-slate-700 m-0">설정</h2>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-md md:max-w-2xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-5 pb-24">

                {/* 화면 */}
                <Section title="화면" color="#7C83FF" isDarkMode={isDarkMode}>
                    <Row label="다크 모드" sub="어두운 화면으로 전환" isDarkMode={isDarkMode}>
                        <Toggle value={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} />
                    </Row>
                </Section>

                {/* 소리 */}
                <Section title="소리" color="#7C83FF" isDarkMode={isDarkMode}>
                    <Row label="배경음악" sub={bgmOn ? `${bgmVolume}%` : '꺼짐'} isDarkMode={isDarkMode}>
                        <div className="flex items-center gap-2">
                            {bgmOn && <VolumeSlider value={bgmVolume} onChange={v => set('hangul_bgm_volume', v, setBgmVolume)} color="#7C83FF" />}
                            <Toggle value={bgmOn} onToggle={() => set('hangul_bgm_on', !bgmOn, setBgmOn)} />
                        </div>
                    </Row>
                    <Divider isDarkMode={isDarkMode} />
                    <Row label="효과음" sub={sfxOn ? `${sfxVolume}%` : '꺼짐'} isDarkMode={isDarkMode}>
                        <div className="flex items-center gap-2">
                            {sfxOn && <VolumeSlider value={sfxVolume} onChange={v => set('hangul_sfx_volume', v, setSfxVolume)} color="#7C83FF" />}
                            <Toggle value={sfxOn} onToggle={() => set('hangul_sfx_on', !sfxOn, setSfxOn)} />
                        </div>
                    </Row>
                </Section>

                {/* 게임 */}
                <Section title="게임" color="#7C83FF" isDarkMode={isDarkMode}>
                    <Row label="진동" sub="햅틱 피드백" isDarkMode={isDarkMode}>
                        <Toggle value={vibration} onToggle={() => set('hangul_vibration', !vibration, setVibration)} />
                    </Row>
                </Section>

                {/* 프로필 */}
                <Section title="프로필" color="#7C83FF" isDarkMode={isDarkMode}>
                    <div className="flex flex-col gap-3">
                        <span className={`text-xs font-bold ${isDarkMode ? 'text-[#AEB7C5]' : 'text-[#5B677A]'}`}>닉네임 변경</span>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={tempNickname}
                                onChange={(e) => setTempNickname(e.target.value)}
                                placeholder="새 닉네임 입력"
                                className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm outline-none transition-all ${
                                    isDarkMode
                                    ? 'bg-slate-900 border border-slate-700 text-white focus:border-[#7C83FF]'
                                    : 'bg-[#F8FAF9] border border-[#E9EDF2] text-slate-700 focus:border-[#7C83FF]'
                                }`}
                            />
                            <button
                                onClick={handleSaveNickname}
                                className="px-4 py-2.5 bg-[#7C83FF] text-white font-extrabold rounded-xl active:scale-95 transition-all text-sm shadow-md"
                            >
                                저장
                            </button>
                        </div>
                    </div>
                    {setSelectedCharacter && (
                        <>
                            <Divider isDarkMode={isDarkMode} />
                            <div className="flex flex-col gap-3">
                                <span className={`text-xs font-bold ${isDarkMode ? 'text-[#AEB7C5]' : 'text-[#5B677A]'}`}>캐릭터 변경</span>
                                <div className="flex gap-2 justify-between">
                                    {CHARACTERS.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => { setSelectedCharacter(c.id); localStorage.setItem(SK.SELECTED_CHARACTER, c.id); }}
                                            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl border-2 transition-all active:scale-95 ${
                                                selectedCharacter === c.id
                                                    ? 'border-[#7C83FF] bg-[#7C83FF]/10'
                                                    : isDarkMode ? 'border-slate-700 bg-slate-900/50' : 'border-[#E9EDF2] bg-white'
                                            }`}
                                        >
                                            <img src={c.image} alt={c.label} className="w-10 h-10 object-contain" />
                                            <span className={`text-[10px] font-black ${selectedCharacter === c.id ? 'text-[#7C83FF]' : isDarkMode ? 'text-slate-400' : 'text-[#AEB7C5]'}`}>{c.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </Section>

                {/* 데이터 */}
                <Section title="데이터" color="#7C83FF" isDarkMode={isDarkMode}>
                    {restoreFromCloud && (
                        <>
                            <button
                                onClick={handleRestore}
                                disabled={isRestoring}
                                className="w-full py-3.5 rounded-2xl font-extrabold text-sm active:scale-95 transition-all shadow-sm border disabled:opacity-50"
                                style={{
                                    backgroundColor: isDarkMode ? 'rgba(124, 131, 255, 0.12)' : 'rgba(124, 131, 255, 0.08)',
                                    borderColor: isDarkMode ? 'rgba(124, 131, 255, 0.3)' : 'rgba(124, 131, 255, 0.2)',
                                    color: isDarkMode ? '#9CA3FF' : '#7C83FF'
                                }}
                            >
                                {isRestoring ? '복원 중...' : '클라우드에서 복원하기'}
                            </button>
                            {restoreMsg && (
                                <p className="text-xs font-bold text-center text-[#AEB7C5] -mt-1">{restoreMsg}</p>
                            )}
                            <Divider isDarkMode={isDarkMode} />
                        </>
                    )}
                    <button
                        onClick={() => setShowResetConfirm(true)}
                        className="w-full py-3.5 rounded-2xl font-extrabold text-sm active:scale-95 transition-all shadow-sm border"
                        style={{
                            backgroundColor: isDarkMode ? 'rgba(255, 141, 114, 0.12)' : 'rgba(255, 141, 114, 0.08)',
                            borderColor: isDarkMode ? 'rgba(255, 141, 114, 0.25)' : 'rgba(255, 141, 114, 0.15)',
                            color: isDarkMode ? '#FFA88D' : '#FF8D72'
                        }}
                    >
                        데이터 초기화
                    </button>
                </Section>

                <p className={`text-center text-xs font-bold pt-2 ${isDarkMode ? 'text-slate-700' : 'text-[#AEB7C5]'}`}>Hangul Pop v1.0.0</p>
            </div>

            {/* 초기화 확인 모달 */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                    <div className={`clay-panel p-8 max-w-sm w-full text-center flex flex-col gap-5 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                        <div>
                            <h3 className={`font-bold text-xl mb-1 ${isDarkMode ? 'text-slate-100' : 'text-[#3C3C3C]'}`}>정말로 초기화할까요?</h3>
                            <p className="text-[#AEB7C5] text-sm font-bold">모든 학습 기록이 삭제됩니다.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { window.localStorage.clear(); window.location.reload(); }}
                                className="flex-1 py-3 rounded-2xl font-black text-white active:scale-95 transition-all shadow-md"
                                style={{
                                    background: 'linear-gradient(135deg, #FF9A76 0%, #FF8A88 100%)',
                                    boxShadow: '0 6px 16px rgba(255, 138, 136, 0.3)'
                                }}
                            >
                                초기화하기
                            </button>
                            <button
                                onClick={() => setShowResetConfirm(false)}
                                className={`flex-1 py-3 rounded-2xl font-bold active:scale-95 transition-all ${isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-[#F4F7F8] text-[#5B677A]'}`}
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
