const GRADE_TESTS = [
    {
        id: 'gradeTest',
        label: '8급',
        range: '기초 50자',
        desc: '숫자, 방향, 가족 등 가장 기본적인 한자',
        color: '#A8E6CF',
        textColor: '#1F6B4A',
        emoji: '⭐',
    },
    {
        id: 'gradeTest72',
        label: '7급Ⅱ',
        range: '초급 100자',
        desc: '위치, 시간, 학교 관련 한자까지 확장',
        color: '#FFADAD',
        textColor: '#9B2C2C',
        emoji: '⭐⭐',
    },
    {
        id: 'gradeTest7',
        label: '7급',
        range: '초중급 150자',
        desc: '자연, 사회, 일상생활 한자 포함',
        color: '#FFD6A5',
        textColor: '#7C4A00',
        emoji: '⭐⭐⭐',
    },
    {
        id: 'gradeTest62',
        label: '6급Ⅱ',
        range: '중급 225자',
        desc: '감정, 행동, 추상 개념 한자까지',
        color: '#BDB2FF',
        textColor: '#4B2F9A',
        emoji: '⭐⭐⭐⭐',
    },
    {
        id: 'gradeTest6',
        label: '6급',
        range: '중급 300자',
        desc: '사회, 문화, 역사 한자를 망라',
        color: '#A5F3FC',
        textColor: '#0C6B82',
        emoji: '⭐⭐⭐⭐⭐',
    },
];

const GradeExamSelectScreen = ({ onBack, onNavigate }) => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ backgroundColor: '#F8FAF9' }}>
            {/* 헤더 */}
            <div className="w-full px-4 shrink-0" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: '4px' }}>
                <div className="minimal-card-studio w-full flex justify-between items-center p-4 px-6 bg-white border-[#E9EDF2] shadow-xl !rounded-[3rem] min-h-[72px]">
                    <button onClick={onBack} className="hp-nav-button">←</button>
                    <div className="flex flex-col items-center min-w-0 flex-1 px-2">
                        <h2 className="text-h3 font-bold text-[#5B677A] m-0 break-keep">급수시험 문제</h2>
                        <p className="text-xs font-bold mt-0.5 text-center leading-tight break-keep" style={{ color: '#969CEB' }}>
                            응시할 급수를 선택해 주세요
                        </p>
                    </div>
                    <div className="w-11" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-16 px-5 pt-6 flex flex-col gap-3 max-w-2xl w-full mx-auto">
                {/* 안내 */}
                <div className="flex items-start gap-3 px-4 py-3 rounded-2xl mb-1" style={{ background: '#F4F3FF', border: '1.5px solid #C3C6FF' }}>
                    <span className="text-base shrink-0 mt-0.5">💡</span>
                    <p className="text-xs font-bold leading-relaxed break-keep" style={{ color: '#6970F0' }}>
                        한국어문회 기준 급수 시험 문제예요. 낮은 급수부터 차근차근 도전해 보세요!
                    </p>
                </div>

                {GRADE_TESTS.map(({ id, label, range, desc, color, textColor, emoji }) => (
                    <button
                        key={id}
                        onClick={() => onNavigate(id)}
                        className="w-full flex items-center gap-4 px-5 py-5 rounded-[1.5rem] active:scale-[0.97] transition-all bg-white border border-[#E9EDF2] shadow-sm"
                        style={{ borderLeftWidth: 5, borderLeftColor: color }}
                    >
                        {/* 왼쪽 아이콘 */}
                        <div
                            className="shrink-0 w-12 h-12 rounded-[1rem] flex items-center justify-center font-black text-lg"
                            style={{ background: color + '33' }}
                        >
                            {label}
                        </div>

                        {/* 텍스트 */}
                        <div className="flex flex-col flex-1 text-left gap-0.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-[1.05rem]" style={{ color: '#3C3C3C' }}>
                                    {label} 시험
                                </span>
                                <span
                                    className="px-2 py-0.5 rounded-full text-xs font-black shrink-0"
                                    style={{ background: color, color: textColor }}
                                >
                                    {range}
                                </span>
                            </div>
                            <span className="text-xs font-bold break-keep" style={{ color: '#9AA4B5' }}>{desc}</span>
                            <span className="text-xs mt-0.5">{emoji}</span>
                        </div>

                        <span className="shrink-0 font-bold text-lg" style={{ color: '#D1D9E0' }}>❯</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default GradeExamSelectScreen;
