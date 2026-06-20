import React, { useState, useMemo } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import IDIOMS from '../data/idioms.js';
import { canAccessGrade } from '../utils/premiumAccess.js';
import { SK } from '../constants/storageKeys.js';

const StudyIcon = ({ type, className = 'w-5 h-5' }) => {
    const paths = {
        study: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v15h4.5a2.5 2.5 0 0 1 2.5 2.5v-15Z" /></>,
        word: <><path d="M4 5h16v11H8l-4 4V5Z" /><path d="M8 9h8M8 12h5" /></>,
        sentence: <><path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-5 3v-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /><path d="M7 8h10M7 12h7" /></>,
        exam: <><path d="M8 3h8l1 3h3v15H4V6h3l1-3Z" /><path d="M9 3h6v4H9V3ZM8 12l2 2 5-5M8 18h8" /></>,
        arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
        check: <path d="m5 12 4 4L19 6" />,
        lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    };
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{paths[type]}</svg>;
};

const GRADE_THEMES = {
    '8급':  { accent: '#2ED6C5', accentDeep: '#0D9488', bgLight: '#E8FAF7', badgeBg: '#E0F7FA', badgeText: '#0D9488' },
    '7급Ⅱ': { accent: '#7C83FF', accentDeep: '#4F56D9', bgLight: '#F2F3FF', badgeBg: '#EEF0FF', badgeText: '#4F56D9' },
    '7급':  { accent: '#9B6BFF', accentDeep: '#7047D9', bgLight: '#F5F0FF', badgeBg: '#F0E9FF', badgeText: '#7047D9' },
    '6급Ⅱ': { accent: '#FF9B73', accentDeep: '#D96B45', bgLight: '#FFF1EC', badgeBg: '#FFE8DE', badgeText: '#C85D39' },
    '6급':  { accent: '#FF6B6B', accentDeep: '#D94C4C', bgLight: '#FFF0F0', badgeBg: '#FFE3E3', badgeText: '#C83D3D' },
};

const BRAND_THEME = {
    accent: '#7C83FF',
    deep: '#5B63E6',
    light: '#EEF0FF',
};

const normalizeGrade = (g) => {
    if (g === '7급II') return '7급Ⅱ';
    if (g === '6급II') return '6급Ⅱ';
    return g;
};

export default function GradeStudyDashboardScreen({
    grade,
    onBack,
    onStartFocusStudy,
    onStartWordQuiz,
    onStartSentenceQuiz,
    onStartMockTest,
    unlockedPack,
    onShowPremiumModal,
    clearedHanjaIds = [],
}) {
    const normalizedGrade = normalizeGrade(grade);
    const theme = GRADE_THEMES[normalizedGrade] || GRADE_THEMES['8급'];
    const isUnlocked = canAccessGrade(unlockedPack, normalizedGrade);

    // 해당 급수 한자만 (누적 아님)
    const thisGradeHanjaList = useMemo(() =>
        HANJA_DATA.filter(h => h.grade && normalizeGrade(h.grade) === normalizedGrade),
    [normalizedGrade]);

    // 학습 진척도
    const clearedIdsSet = useMemo(() => new Set(clearedHanjaIds), [clearedHanjaIds]);
    const clearedCount = useMemo(() =>
        thisGradeHanjaList.filter(h => clearedIdsSet.has(h.id)).length,
    [thisGradeHanjaList, clearedIdsSet]);
    const progressPct = thisGradeHanjaList.length > 0
        ? Math.round((clearedCount / thisGradeHanjaList.length) * 100) : 0;

    // 모의고사 통과 상태
    const mockPassed = useMemo(() => {
        try {
            const saved = localStorage.getItem(SK.UNLOCKED_GRADE);
            if (!saved) return false;
            const order = ['8급', '7급Ⅱ', '7급', '6급Ⅱ', '6급'];
            return order.indexOf(normalizeGrade(saved)) >= order.indexOf(normalizedGrade);
        } catch { return false; }
    }, [normalizedGrade]);

    // 단어장 탭
    const [wordTab, setWordTab] = useState('words');
    const [showVocabulary, setShowVocabulary] = useState(false);
    const [wordSearch, setWordSearch] = useState('');

    // 해당 급수 단어 목록
    const gradeWords = useMemo(() =>
        thisGradeHanjaList.flatMap(h =>
            (h.words || []).filter(w => w.type !== 'idiom').map(w => ({ ...w, hanjaChar: h.hanja }))
        ),
    [thisGradeHanjaList]);

    const gradeSentenceCount = useMemo(() =>
        gradeWords.filter(w => typeof w.example === 'string' && w.example.trim().length > 0).length,
    [gradeWords]);

    // 해당 급수 사자성어 목록 (중복 제거)
    const gradeIdioms = useMemo(() => {
        const seen = new Set();
        return thisGradeHanjaList.flatMap(h =>
            (h.words || []).filter(w => w.type === 'idiom')
        ).filter(w => {
            if (seen.has(w.word)) return false;
            seen.add(w.word);
            return true;
        }).map(w => {
            const meta = IDIOMS.find(x => x.hanja === w.word);
            return meta ? { ...meta, ...w } : w;
        });
    }, [thisGradeHanjaList]);

    const handleActionClick = (actionFn) => {
        if (!isUnlocked) { onShowPremiumModal?.(); } else { actionFn?.(); }
    };

    const activeVocabulary = wordTab === 'words' ? gradeWords : gradeIdioms;
    const filteredVocabulary = useMemo(() => {
        const query = wordSearch.trim().toLowerCase();
        if (!query) return activeVocabulary;
        return activeVocabulary.filter(item =>
            [item.word, item.hanja, item.reading, item.meaning]
                .filter(Boolean)
                .some(value => String(value).toLowerCase().includes(query))
        );
    }, [activeVocabulary, wordSearch]);

    const renderVocabularyRow = (w, i, isIdiom = false) => (
        <div key={w.id ?? `${w.word ?? w.hanja}-${i}`} className="rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.035)]">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-baseline gap-1.5 min-w-0">
                    <span className={`${isIdiom ? 'hanja-char text-2xl' : 'text-lg'} font-semibold text-slate-800 dark:text-slate-100`}>{w.word ?? w.hanja}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{w.reading}</span>
                </div>
                {!isIdiom && w.hanjaChar && (
                    <span className="rounded-lg px-2 py-0.5 text-sm shrink-0"
                        style={{ backgroundColor: theme.bgLight, color: theme.accentDeep }}>{w.hanjaChar}</span>
                )}
            </div>
            <p className="mt-1.5 text-base leading-relaxed text-slate-600 dark:text-slate-300 break-keep">{w.meaning}</p>
        </div>
    );

    if (showVocabulary) {
        return (
            <div className="flex flex-col w-full h-[100dvh] overflow-hidden bg-[#F8FAF9] dark:bg-slate-900">
                <header className="shrink-0 w-full max-w-2xl mx-auto px-4 pb-3 flex items-center justify-between"
                    style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}>
                    <button onClick={() => { setShowVocabulary(false); setWordSearch(''); }} aria-label="학습관으로 돌아가기"
                        className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-sm active:scale-95 transition-transform">
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <div className="text-center">
                        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{normalizedGrade} 단어장</h1>
                        <p className="text-sm text-slate-400 mt-0.5">단어와 사자성어를 찾아보세요</p>
                    </div>
                    <div className="w-10" />
                </header>

                <main className="flex-1 overflow-y-auto px-4 pb-10 w-full max-w-2xl mx-auto">
                    <div className="sticky top-0 z-10 bg-[#F8FAF9]/95 dark:bg-slate-900/95 backdrop-blur-xl pb-3">
                        <label className="h-12 px-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center gap-3 shadow-sm">
                            <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
                            <input value={wordSearch} onChange={e => setWordSearch(e.target.value)}
                                placeholder="한자, 음, 뜻 검색" className="w-full bg-transparent outline-none text-base text-slate-800 dark:text-slate-100 placeholder:text-slate-400" />
                        </label>
                        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 mt-3">
                            {[{ id: 'words', label: '단어', count: gradeWords.length }, { id: 'idioms', label: '사자성어', count: gradeIdioms.length }].map(t => (
                                <button key={t.id} onClick={() => { setWordTab(t.id); setWordSearch(''); }}
                                    className={`rounded-xl py-2.5 text-base font-semibold transition-all ${wordTab === t.id ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400'}`}>
                                    {t.label} <span className="ml-1 text-sm opacity-70">{t.count}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-1 py-2">
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{wordTab === 'words' ? '전체 단어' : '전체 사자성어'}</p>
                        <p className="text-sm text-slate-400">{filteredVocabulary.length}개</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        {filteredVocabulary.length
                            ? filteredVocabulary.map((w, i) => renderVocabularyRow(w, i, wordTab === 'idioms'))
                            : <p className="text-center text-sm text-slate-400 py-16">검색 결과가 없습니다</p>}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full h-[100dvh] overflow-hidden bg-[#F8FAF9] dark:bg-slate-900">
            {/* 헤더 */}
            <header className="shrink-0 w-full max-w-2xl mx-auto px-4 pb-3 flex items-center justify-between z-30"
                style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}>
                <button onClick={onBack} aria-label="뒤로 가기" className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-sm active:scale-95 transition-transform">
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                    {normalizedGrade} 학습관
                </h1>
                <span className="min-w-10 text-right text-sm font-semibold" style={{ color: isUnlocked ? BRAND_THEME.deep : '#94A3B8' }}>
                    {isUnlocked ? '이용 가능' : '잠김'}
                </span>
            </header>

            <main className="flex-1 overflow-y-auto px-4 pb-10 flex flex-col gap-7 w-full max-w-2xl mx-auto">

                {/* 진척도 카드 */}
                <section className="shrink-0 rounded-[1.75rem] border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] flex flex-col gap-5 overflow-hidden relative">
                    <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full opacity-60" style={{ backgroundColor: theme.bgLight }} />
                    <div className="flex justify-between items-start relative">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">학습 진행률</p>
                            <p className="text-[30px] leading-none font-bold text-slate-900 dark:text-white tracking-tight mt-2">
                                {progressPct}<span className="text-lg">%</span>
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{clearedCount} / {thisGradeHanjaList.length}자 학습 완료</p>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold relative"
                            style={{ backgroundColor: mockPassed ? BRAND_THEME.light : '#F1F5F9', color: mockPassed ? BRAND_THEME.deep : '#64748B' }}>
                            <StudyIcon type={mockPassed ? 'check' : 'exam'} className="w-3.5 h-3.5" />
                            {mockPassed ? '급수 인증 완료' : '급수 미인증'}
                        </div>
                    </div>
                    <div className="relative">
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${progressPct}%`, backgroundColor: BRAND_THEME.deep }} />
                        </div>
                    </div>
                    <button
                        onClick={() => progressPct === 100 && !mockPassed
                            ? handleActionClick(onStartMockTest)
                            : handleActionClick(() => onStartFocusStudy?.(thisGradeHanjaList))}
                        className="grade-study-primary-button relative w-full h-12 rounded-2xl px-4 text-white flex items-center justify-between font-semibold text-base"
                        style={{ '--grade-start': BRAND_THEME.accent, '--grade-end': BRAND_THEME.deep }}
                    >
                        <span>{progressPct === 100 && !mockPassed ? `${normalizedGrade} 인증 시험 보기` : progressPct > 0 ? '이어서 학습하기' : '한자 학습 시작하기'}</span>
                        <StudyIcon type="arrow" className="w-5 h-5" />
                    </button>
                </section>

                {/* 학습 메뉴 */}
                <section className="shrink-0 flex flex-col gap-3">
                    <div className="flex items-end justify-between px-1">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">학습 메뉴</h2>
                        <p className="text-[15px] text-slate-400">{normalizedGrade} 전용 콘텐츠</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { type: 'study', title: '한자 학습', desc: `${thisGradeHanjaList.length}자 카드`, action: () => onStartFocusStudy?.(thisGradeHanjaList) },
                            { type: 'word', title: '단어 퀴즈', desc: `${gradeWords.length}개 단어`, action: onStartWordQuiz },
                            { type: 'sentence', title: '문장 퀴즈', desc: `예문 ${gradeSentenceCount}개`, action: onStartSentenceQuiz },
                            { type: 'exam', title: '모의시험', desc: mockPassed ? '인증 완료' : '급수 인증 도전', action: onStartMockTest },
                        ].map(item => (
                            <button key={item.type} onClick={() => handleActionClick(item.action)}
                                className="grade-study-menu-card min-h-[116px] rounded-3xl border border-slate-200/70 dark:border-slate-700 p-4 text-left relative flex flex-col items-start"
                                style={{ '--menu-soft': theme.bgLight, '--menu-accent': theme.accentDeep }}>
                                {!isUnlocked && <StudyIcon type="lock" className="absolute top-4 right-4 w-3.5 h-3.5 text-slate-400" />}
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 shrink-0" style={{ backgroundColor: theme.bgLight, color: theme.accentDeep }}>
                                    <StudyIcon type={item.type} className="w-5 h-5" />
                                </div>
                                <div className="mt-auto">
                                    <p className="text-lg leading-tight font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                                    <p className="text-base leading-snug text-slate-500 dark:text-slate-400 mt-1.5">{item.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* 단어장 */}
                <section className="shrink-0 flex flex-col gap-3">
                    <div className="flex items-end justify-between px-1">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">단어장 미리보기</h2>
                            <p className="text-[15px] text-slate-400 mt-1">{normalizedGrade} 단어 {gradeWords.length} · 사자성어 {gradeIdioms.length}</p>
                        </div>
                        <span className="text-[15px] font-semibold" style={{ color: BRAND_THEME.deep }}>총 {gradeWords.length + gradeIdioms.length}개</span>
                    </div>

                    <div className="flex flex-col gap-2">
                        {gradeWords.slice(0, 2).map((w, i) => renderVocabularyRow(w, i))}
                    </div>
                    <button onClick={() => { setWordTab('words'); setShowVocabulary(true); }}
                        className="grade-study-primary-button h-12 rounded-2xl px-4 text-white flex items-center justify-between font-semibold text-base"
                        style={{ '--grade-start': BRAND_THEME.accent, '--grade-end': BRAND_THEME.deep }}>
                        <span>전체 단어장 보기</span>
                        <span className="flex items-center gap-2 text-[15px] font-medium opacity-90">
                            {gradeWords.length + gradeIdioms.length}개 <StudyIcon type="arrow" className="w-4 h-4" />
                        </span>
                    </button>
                </section>
            </main>

        </div>
    );
}
