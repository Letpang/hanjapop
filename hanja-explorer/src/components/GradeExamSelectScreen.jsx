const GRADE_TESTS = [
    {
        id: 'gradeTest',
        label: '8급',
        range: '배정 50자',
        desc: '숫자, 방향, 가족 등 가장 기본적인 한자',
        accent: '#2ED6C5',
        accentDeep: '#0D9488',
        level: 1,
    },
    {
        id: 'gradeTest72',
        label: '7급Ⅱ',
        range: '배정 50자',
        desc: '위치, 시간, 학교 관련 한자까지 확장',
        accent: '#7C83FF',
        accentDeep: '#4F56D9',
        level: 2,
    },
    {
        id: 'gradeTest7',
        label: '7급',
        range: '배정 50자',
        desc: '자연, 사회, 일상생활 한자 포함',
        accent: '#9B6BFF',
        accentDeep: '#7047D9',
        level: 3,
    },
    {
        id: 'gradeTest62',
        label: '6급Ⅱ',
        range: '배정 75자',
        desc: '감정, 행동, 추상 개념 한자까지',
        accent: '#FF9B73',
        accentDeep: '#D96B45',
        level: 4,
    },
    {
        id: 'gradeTest6',
        label: '6급',
        range: '배정 75자',
        desc: '사회, 문화, 역사 한자를 망라',
        accent: '#FF6B6B',
        accentDeep: '#D94C4C',
        level: 5,
    },
];

const GradeExamSelectScreen = ({ onBack, onSelectGrade }) => {
    return (
        <div className="grade-exam-select-screen">
            <div className="grade-exam-select-header-wrap">
                <header className="grade-exam-select-header">
                    <button onClick={onBack} className="hp-nav-button grade-exam-back-button" aria-label="뒤로 가기">
                        <span aria-hidden="true" className="grade-exam-chevron grade-exam-chevron--left" />
                    </button>
                    <div className="grade-exam-title-block">
                        <span className="grade-exam-eyebrow">HANJA LEVEL LAB</span>
                        <h2 className="grade-exam-title">급수별 학습관</h2>
                        <p className="grade-exam-subtitle">나에게 맞는 급수부터 시작해요</p>
                    </div>
                    <div className="grade-exam-header-spacer" />
                </header>
            </div>

            <main className="grade-exam-select-content">
                <section className="grade-exam-guide" aria-label="급수별 학습관 안내">
                    <span className="grade-exam-guide-mark" aria-hidden="true">級</span>
                    <span className="grade-exam-guide-copy">
                        <strong>급수별 맞춤 학습</strong>
                        <small>한자 학습부터 퀴즈와 인증 시험까지 한곳에서 준비해요.</small>
                    </span>
                </section>

                <div className="grade-exam-card-list">
                    {GRADE_TESTS.map(({ id, label, range, desc, accent, accentDeep, level }) => (
                        <button
                            key={id}
                            onClick={() => onSelectGrade(label)}
                            className="grade-exam-card"
                            style={{ '--grade-accent': accent, '--grade-accent-deep': accentDeep }}
                        >
                            <span className="grade-exam-card-stripe" aria-hidden="true" />
                            <span className="grade-exam-card-shine" aria-hidden="true" />
                            <span className="grade-exam-badge" aria-hidden="true">{label}</span>

                            <span className="grade-exam-card-body">
                                <span className="grade-exam-card-heading">
                                    <span className="grade-exam-card-title">{label} 학습관</span>
                                    <span className="grade-exam-range">{range}</span>
                                </span>
                                <span className="grade-exam-card-desc">{desc}</span>
                                <span className="grade-exam-level-row">
                                    <span className="grade-exam-level-label">난이도 {level}</span>
                                    <span className="grade-exam-level-meter" aria-label={`난이도 ${level}단계`}>
                                    {Array.from({ length: 5 }, (_, index) => (
                                        <span
                                            key={index}
                                            className={index < level ? 'is-active' : ''}
                                            aria-hidden="true"
                                        />
                                    ))}
                                    </span>
                                </span>
                            </span>

                            <span className="grade-exam-card-action" aria-hidden="true">
                                <span className="grade-exam-chevron" />
                            </span>
                        </button>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default GradeExamSelectScreen;
