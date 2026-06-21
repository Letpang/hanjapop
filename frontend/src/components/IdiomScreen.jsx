import { useState, useMemo, useRef, useCallback } from 'react';
import { pickClearMessage } from '../constants/messages.js';
import QuizProgressBar from './QuizProgressBar.jsx';
import IDIOMS from '../data/idioms.js';
import HANJA_DATA from '../hanja_unified.json';
import CtaButton from './common/CtaButton.jsx';
import QuizResultOverlay from './common/QuizResultOverlay.jsx';
import QuizCard, { SpeakButton } from './common/QuizCard.jsx';
import { getRankDetails, getCharacterImage, getCharacterScale, getCharacterTranslateY } from '../utils/rankUtils.js';


const collectIdioms = (hanjaIds) => {
    const idSet = new Set(hanjaIds);
    const seen = new Set();
    const result = [];
    for (const item of HANJA_DATA) {
        if (!idSet.has(item.id)) continue;
        for (const w of (item.words || [])) {
            if (w.type !== 'idiom' || seen.has(w.word)) continue;
            seen.add(w.word);
            const meta = IDIOMS.find(x => x.hanja === w.word);
            if (meta) result.push({ ...meta, targetHanja: item.hanja });
        }
    }
    return result;
};

const IDIOM_WRONG_KEY = 'idiom_wrong_data';

const idiomKey = (item) => item.id || item.hanja;

const readIdiomWrongData = () => {
    try { return JSON.parse(localStorage.getItem(IDIOM_WRONG_KEY) || '{}'); } catch { return {}; }
};

const writeIdiomWrong = (item) => {
    const key = idiomKey(item);
    const data = readIdiomWrongData();
    const prev = data[key] || {};
    data[key] = {
        wrongCount: (prev.wrongCount || 0) + 1,
        lastWrongAt: new Date().toISOString(),
    };
    localStorage.setItem(IDIOM_WRONG_KEY, JSON.stringify(data));
};

const clearIdiomWrong = (item) => {
    const key = idiomKey(item);
    const data = readIdiomWrongData();
    const prev = data[key] || {};
    data[key] = {
        ...prev,
        correctCount: (prev.correctCount || 0) + 1,
    };
    if (data[key].wrongCount) {
        delete data[key].wrongCount;
    }
    localStorage.setItem(IDIOM_WRONG_KEY, JSON.stringify(data));
};

const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const ALL_CHARS = () => [...new Set(IDIOMS.flatMap(i => [...i.hanja]))];

const buildQuiz = (idioms) => {
    if (idioms.length === 0) return [];
    const allChars = ALL_CHARS();
    const questions = [];

    shuffle([...idioms]).forEach((item, i) => {
        const others = IDIOMS.filter(x => x.hanja !== item.hanja);
        const type = i % 3;

        if (type === 0) {
            // 괄호 채우기
            let blankIdx = item.targetHanja ? item.hanja.indexOf(item.targetHanja) : -1;
            if (blankIdx === -1) {
                blankIdx = Math.floor(Math.random() * 4);
            }
            const correct = item.hanja[blankIdx];
            const displayHanja = [...item.hanja].map((ch, j) => j === blankIdx ? '(  )' : ch).join('');
            const displayReading = [...item.reading].map((ch, j) => j === blankIdx ? '○' : ch).join('');
            const distractors = shuffle(allChars.filter(c => c !== correct)).slice(0, 3);
            questions.push({
                ...item,
                type: 'fill_blank',
                typeLabel: '괄호 채우기',
                prompt: '괄호 안에 들어갈 한자는?',
                displayHanja,
                displayReading,
                choices: shuffle([correct, ...distractors]),
                answer: correct,
            });
        } else if (type === 1) {
            // 독음 읽기
            const distractors = shuffle(others).slice(0, 3).map(x => x.reading);
            questions.push({
                ...item,
                type: 'reading',
                typeLabel: '독음 읽기',
                prompt: '다음 사자성어의 독음(讀音)은?',
                choices: shuffle([item.reading, ...distractors]),
                answer: item.reading,
            });
        } else {
            if (i % 6 < 3) {
                // 뜻 찾기
                const distractors = shuffle(others).slice(0, 3).map(x => x.meaning);
                questions.push({
                    ...item,
                    type: 'meaning_from_idiom',
                    typeLabel: '뜻 찾기',
                    prompt: '다음 사자성어의 뜻은?',
                    choices: shuffle([item.meaning, ...distractors]),
                    answer: item.meaning,
                });
            } else {
                // 사자성어 찾기
                const distractors = shuffle(others).slice(0, 3).map(x => x.hanja);
                questions.push({
                    ...item,
                    type: 'idiom_from_meaning',
                    typeLabel: '사자성어 찾기',
                    prompt: '다음 뜻에 해당하는 사자성어는?',
                    displayMeaning: item.meaning,
                    choices: shuffle([item.hanja, ...distractors]),
                    answer: item.hanja,
                });
            }
        }
    });

    return questions;
};

const IdiomQuiz = ({ idioms, onBack, onComplete, onHanjaAcquired, userXp, selectedCharacter, getRewardPreview, missionDone = false }) => {
    const questions = useMemo(() => buildQuiz(idioms), [idioms]);
    const [idx, setIdx] = useState(0);
    const [resultClearMsg] = useState(() => pickClearMessage());
    const [score, setScore] = useState(0);
    const [done, setDone] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [currentAnswered, setCurrentAnswered] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const clearCountRef = useRef(0);
    const missionXpGrantedRef = useRef(0);

    const characterAvatar = useMemo(() => {
        if (!selectedCharacter) return null;
        return getRankDetails(userXp || 0, selectedCharacter).avatar;
    }, [userXp, selectedCharacter]);

    const q = questions[idx];

    const handleCorrect = useCallback((isFirstAttempt) => {
        setCurrentAnswered(true);
        if (isFirstAttempt) {
            setScore(s => s + 1);
            clearIdiomWrong(q);
        }
    }, [q]);

    const handleWrong = useCallback(() => {
        writeIdiomWrong(q);
    }, [q]);

    const handleNext = useCallback(() => {
        setCurrentAnswered(false);
        if (idx + 1 >= questions.length) {
            setCompleting(true);
            // onComplete 호출 전에 missionDone 스냅샷 — setMissions + setDone이 배칭되어
            // overlay render 시점에 missionDone이 이미 true로 바뀌는 문제 방지
            const willGrantMission = !missionDone && clearCountRef.current === 0;
            clearCountRef.current += 1;
            missionXpGrantedRef.current = willGrantMission ? 25 : 0;
            onComplete?.(score);
            setDone(true);
        } else {
            setIdx(i => i + 1);
        }
    }, [idx, questions.length, onComplete, missionDone, score]);

    const handlePrev = useCallback(() => {
        if (idx === 0) return;
        setCurrentAnswered(false);
        setIdx(i => i - 1);
    }, [idx]);

    const isLargeChoice = q?.type === 'fill_blank' || q?.type === 'idiom_from_meaning';
    const choiceGridClass = isLargeChoice
        ? 'quiz-choice-grid'
        : `grade-test-choice-grid${q?.type === 'meaning_from_idiom' ? ' grade-test-choice-grid--single' : ''}`;
    const choiceGridStyle = isLargeChoice ? { gridTemplateColumns: 'repeat(2, 1fr)' } : undefined;
    const choiceClass = isLargeChoice ? 'quiz-choice-btn--large quiz-choice-btn--hanja' : '';

    const resultOverlay = (() => {
        if (!done) return null;
        const pct = Math.round((score / questions.length) * 100);
        const isClear = pct >= 70;
        const correctXp = score * 5;
        const clearXp = 25;
        const reward = getRewardPreview?.(correctXp + clearXp);
        return (
            <QuizResultOverlay
                isClear={isClear}
                completedLabel="사자성어 완료!"
                clearTitle={pct === 100 ? '완벽해요! 마스터!' : resultClearMsg}
                scoreNode={`${score} / ${questions.length}문제 정답`}
                selectedCharacter={selectedCharacter}
                reward={reward}
                correctXp={correctXp}
                clearXp={clearXp}
                detailText={`${score}개 정답 x 5XP + 완료 ${clearXp}XP`}
                missionXp={missionXpGrantedRef.current}
                onRetry={() => { setIdx(0); setScore(0); setDone(false); setCompleting(false); setCurrentAnswered(false); }}
                onBack={onBack}
                backLabel="목록으로 돌아가기"
            />
        );
    })();

    if (!q) {
        console.log("IdiomQuiz: !q triggered. idioms.length:", idioms.length, "questions.length:", questions.length);
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F8FAF9] dark:bg-slate-900 px-6" style={{ backgroundColor: '#F8FAF9', color: '#334155' }}>
                <h2 className="text-2xl font-bold mb-4">사자성어가 없어요!</h2>
                <p className="text-body text-center mb-8 break-keep">
                    선택하신 단계(일차)의 한자에는 아직 배울 사자성어가 포함되어 있지 않아요. 다른 단계를 선택해주세요!
                </p>
                <CtaButton onClick={onBack}>돌아가기</CtaButton>
            </div>
        );
    }

    return (
        <div className="idiom-quiz-shell">
            <div className="w-full shrink-0 mb-4 w-full max-w-lg mx-auto">
                <div className="quiz-header-card quiz-header-card--sm">
                    <button onClick={() => setShowExitModal(true)} className="hp-nav-button">
                        <span>✕</span>
                    </button>
                    <div className="quiz-header-title-area">
                        <h2 className="quiz-screen-title">사자성어 퀴즈</h2>
                        <p className="screen-subtitle">사자성어를 보고 뜻을 맞혀보세요</p>
                    </div>
                    <div className="quiz-header-right">
                        <span className="quiz-counter-text">{idx + 1}/{questions.length}</span>
                    </div>
                </div>
                <QuizProgressBar current={idx} total={questions.length} answered={currentAnswered} completing={completing} avatar={characterAvatar} charType={selectedCharacter} />
            </div>

            <QuizCard
                key={idx}
                choices={q.choices}
                correctAnswer={q.answer}
                cardLayout="content"
                choiceGridClassName={choiceGridClass}
                choiceGridStyle={choiceGridStyle}
                choiceClassName={choiceClass}
                isFirst={idx === 0}
                isLast={idx === questions.length - 1}
                completing={completing}
                speakText={q.reading}
                xpAmount={5}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
                onNext={handleNext}
                onPrev={handlePrev}
                onCorrectSelected={() => setCurrentAnswered(true)}
                renderFront={() => (
                    <div className="grade-test-question-card" style={{ height: '100%' }}>
                        <span className="grade-test-type-label">{q.typeLabel}</span>
                        <p className="grade-test-prompt">{q.prompt}</p>
                        {q.type === 'fill_blank' && (
                            <div className="grade-test-hanja-box grade-test-hanja-box--compound">
                                <span className="grade-test-hanja-char hanja-char">{q.displayHanja}</span>
                            </div>
                        )}
                        {(q.type === 'reading' || q.type === 'meaning_from_idiom') && (
                            <div className="grade-test-hanja-box grade-test-hanja-box--compound">
                                <span className="grade-test-hanja-char hanja-char">{q.hanja}</span>
                            </div>
                        )}
                        {q.type === 'idiom_from_meaning' && (
                            <p className="grade-exam-guide-text text-center">{q.displayMeaning}</p>
                        )}
                        {q.origin && (
                            <p className="text-xs text-[#9AA4B5] text-center px-4 leading-relaxed break-keep border-t border-[#E9EDF2] pt-5 mt-4 pb-2">{q.origin}</p>
                        )}
                    </div>
                )}
                renderBack={({ isSpeaking, onSpeak }) => (
                    <div className="grade-test-question-card flex flex-col items-center justify-center gap-3 py-10">
                        <SpeakButton isSpeaking={isSpeaking} onSpeak={(e) => { e.stopPropagation(); onSpeak(e); }}
                            className="absolute top-4 right-4" />
                        <span className="hanja-char text-5xl font-medium text-[#4F56D9] tracking-tighter mt-2">{q.hanja}</span>
                        <span className="text-2xl font-normal text-[#7C83FF]">{q.reading}</span>
                        <p className="quiz-card-back__text text-center px-2">{q.meaning}</p>
                    </div>
                )}
            />

            {showExitModal && (
                <div className="modal-overlay">
                    <div className="exit-confirm-card">
                        <img src={getCharacterImage(selectedCharacter, 'keep_going')} alt="exit confirm"
                            className="img-shadow-sm"
                            style={{ transform: `translateY(${getCharacterTranslateY(selectedCharacter)}) scale(${getCharacterScale(selectedCharacter, 'keep_going')})` }} />
                        <div className="exit-confirm-content">
                            <h2 className="exit-confirm-title">정말 퀴즈를 중단할까요?</h2>
                            <p className="body-muted break-keep">지금 나가면 진행 중인 퀴즈의 학습 진행 상황이 저장되지 않아요. 계속 끝까지 풀어볼까요?</p>
                        </div>
                        <div className="result-btn-area">
                            <CtaButton theme="indigo" onClick={() => setShowExitModal(false)}>
                                <span className="quiz-cta-text">계속 공부하기</span>
                            </CtaButton>
                            <button onClick={onBack} className="back-quiz-button">그만하고 나가기</button>
                        </div>
                    </div>
                </div>
            )}
            {resultOverlay}
        </div>
    );
};

const IdiomScreen = ({ onBack, onComplete, onHanjaAcquired, contentPool, grade, day, userXp, selectedCharacter, getRewardPreview, missionDone = false }) => {
    const idioms = useMemo(() => {
        const mainIds = contentPool?.main?.hanjaIds || [];
        return collectIdioms(mainIds);
    }, [contentPool]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#F8FAF9] dark:bg-slate-900">
            <div className="w-full shrink-0" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }} />
            <IdiomQuiz idioms={idioms} onBack={onBack} onComplete={onComplete} onHanjaAcquired={onHanjaAcquired} userXp={userXp} selectedCharacter={selectedCharacter} getRewardPreview={getRewardPreview} missionDone={missionDone} />
        </div>
    );
};

export default IdiomScreen;
