const GRADE_TESTS = [
    {
        id: 'gradeTest',
        label: '8급',
        range: '기초 50자',
        desc: '숫자, 방향, 가족 등 가장 기본적인 한자',
        accent: '#8FE3C2',
        accentDeep: '#207A5A',
        level: 1,
    },
    {
        id: 'gradeTest72',
        label: '7급Ⅱ',
        range: '초급 100자',
        desc: '위치, 시간, 학교 관련 한자까지 확장',
        accent: '#FF9FA3',
        accentDeep: '#A8323B',
        level: 2,
    },
    {
        id: 'gradeTest7',
        label: '7급',
        range: '초중급 150자',
        desc: '자연, 사회, 일상생활 한자 포함',
        accent: '#FFC879',
        accentDeep: '#83530D',
        level: 3,
    },
    {
        id: 'gradeTest62',
        label: '6급Ⅱ',
        range: '중급 225자',
        desc: '감정, 행동, 추상 개념 한자까지',
        accent: '#A99CFF',
        accentDeep: '#5140A5',
        level: 4,
    },
    {
        id: 'gradeTest6',
        label: '6급',
        range: '중급 300자',
        desc: '사회, 문화, 역사 한자를 망라',
        accent: '#7EE7F2',
        accentDeep: '#0D7284',
        level: 5,
    },
];

const GradeExamSelectScreen = ({ onBack, onNavigate }) => {
    return (
        <div className="grade-exam-select-screen">
            <div className="grade-exam-select-header-wrap">
                <header className="grade-exam-select-header">
                    <button onClick={onBack} className="hp-nav-button grade-exam-back-button" aria-label="뒤로 가기">
                        <span aria-hidden="true" className="grade-exam-chevron grade-exam-chevron--left" />
                    </button>
                    <div className="grade-exam-title-block">
                        <h2 className="grade-exam-title">급수시험 문제</h2>
                        <p className="grade-exam-subtitle">응시할 급수를 선택해 주세요</p>
                    </div>
                    <div className="grade-exam-header-spacer" />
                </header>
            </div>

            <main className="grade-exam-select-content">
                <section className="grade-exam-guide" aria-label="급수시험 안내">
                    <span className="grade-exam-guide-mark" aria-hidden="true">i</span>
                    <p className="grade-exam-guide-text">
                        한국어문회 기준 급수 시험 문제예요. 낮은 급수부터 차근차근 도전해 보세요.
                    </p>
                </section>

                <div className="grade-exam-card-list">
                    {GRADE_TESTS.map(({ id, label, range, desc, accent, accentDeep, level }) => (
                        <button
                            key={id}
                            onClick={() => onNavigate(id)}
                            className="grade-exam-card"
                            style={{ '--grade-accent': accent, '--grade-accent-deep': accentDeep }}
                        >
                            <span className="grade-exam-card-stripe" aria-hidden="true" />
                            <span className="grade-exam-badge" aria-hidden="true">{label}</span>

                            <span className="grade-exam-card-body">
                                <span className="grade-exam-card-heading">
                                    <span className="grade-exam-card-title">{label} 시험</span>
                                    <span className="grade-exam-range">{range}</span>
                                </span>
                                <span className="grade-exam-card-desc">{desc}</span>
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
