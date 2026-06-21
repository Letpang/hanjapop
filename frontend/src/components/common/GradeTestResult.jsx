import { useMemo, useState, useRef } from 'react';
import CtaButton from './CtaButton.jsx';
import ResultModalShell, {
    ResultModalActions,
    ResultModalHeading,
    ResultSecondaryButton,
    ResultShareButton,
} from './ResultModalShell.jsx';
import { getCharacterImage, getCharacterScale, getCharacterTranslateY } from '../../utils/rankUtils.js';
import { shareImageToKakao } from '../../utils/kakaoShare.js';

const GRADE_BADGE_IMAGES = {
    '8급': '/assets/images/badges/badge_grade_8.webp',
    '7급II': '/assets/images/badges/badge_grade_7_2.webp',
    '7급Ⅱ': '/assets/images/badges/badge_grade_7_2.webp',
    '7급': '/assets/images/badges/badge_grade_7.webp',
    '6급II': '/assets/images/badges/badge_grade_6_2.webp',
    '6급Ⅱ': '/assets/images/badges/badge_grade_6_2.webp',
    '6급': '/assets/images/badges/badge_grade_6.webp',
};

const GradeTestResult = ({
    passed,
    correct,
    total,
    passCount,
    grade,
    nextGrade,
    alreadyUnlocked,
    selectedCharacter,
    answers = [],
    onRetry,
    onFinish,
}) => {
    const [showAnswerReport, setShowAnswerReport] = useState(false);
    const [filter, setFilter] = useState('all');
    const [shareStatus, setShareStatus] = useState('');
    const cardRef = useRef(null);

    const handleShare = async () => {
        setShareStatus('화면 캡처 중...');
        try {
            let file = null;
            if (cardRef.current) {
                const { default: html2canvas } = await import('html2canvas');
                const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: null });
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.95));
                if (blob) file = new File([blob], 'hanjapop-grade.png', { type: 'image/png' });
            }
            setShareStatus('카카오톡 연결 중...');
            await shareImageToKakao({
                file,
                title: `한자팝 ${grade} 합격했어요!`,
                description: `${correct}/${total} 정답 · 한자팝 급수 인증`,
                fallbackText: `한자팝 ${grade} 합격!\n${correct}/${total} 정답으로 통과했어요`,
            });
            setShareStatus('카카오톡 공유를 열었어요');
        } catch (error) {
            if (error?.name === 'AbortError' || /cancel|close|canceled/i.test(String(error?.message || error))) {
                setShareStatus(''); return;
            }
            setShareStatus('공유에 실패했어요.');
        }
        setTimeout(() => setShareStatus(''), 3500);
    };
    const percent = total > 0 ? Math.min(100, Math.round((correct / total) * 100)) : 0;
    const wrongCount = Math.max(0, total - correct);
    const filteredAnswers = useMemo(() => {
        if (filter === 'correct') return answers.filter(answer => answer.isCorrect);
        if (filter === 'wrong') return answers.filter(answer => !answer.isCorrect);
        return answers;
    }, [answers, filter]);
    const characterImage = getCharacterImage(selectedCharacter, passed ? 'success' : 'failure');
    const badgeImage = GRADE_BADGE_IMAGES[grade];
    const title = passed ? `${grade} 인증 완료!` : '조금 아쉬운 결과예요';
    const subtitle = passed
        ? (nextGrade ? `${nextGrade} 시험에 도전할 수 있어요` : '모든 급수 인증을 마쳤어요')
        : '다시 풀면 충분히 올라갈 수 있어요';
    const unlockText = `${grade} 뱃지 획득!`;

    const cleanSentence = sentence => sentence?.replace(/\(\s*([^)]*?)\s*\)/g, '$1') || '';

    if (!showAnswerReport) {
        return (
            <ResultModalShell
                ref={cardRef}
                tone={passed ? 'clear' : 'fail'}
                size="md"
                cardClassName="grade-test-result-card flex flex-col items-center text-center"
                labelledBy="grade-test-result-title"
            >
                    <img
                        src={characterImage}
                        alt=""
                        className="w-36 h-36 object-contain mb-1 drop-shadow-[0_18px_28px_rgba(91,103,122,0.12)]"
                        style={{ transform: `translateY(${getCharacterTranslateY(selectedCharacter, true)}) scale(${getCharacterScale(selectedCharacter, passed ? 'success' : 'failure')})` }}
                    />
                    <ResultModalHeading
                        id="grade-test-result-title"
                        tone={passed ? 'clear' : 'fail'}
                        kicker={passed ? '급수 인증 시험 완료' : '괜찮아요, 다시 도전해봐요!'}
                        title={title}
                        description={subtitle}
                    />

                    <div className="w-full mt-5 rounded-[1.75rem] border-4 border-[#E9EDF2] bg-white px-5 py-4 shadow-inner">
                        <div className="flex items-end justify-center gap-2">
                            <span className={`text-[3rem] leading-none font-normal tracking-tight ${passed ? 'text-[#00A891]' : 'text-[#FF6B6B]'}`}>{correct}</span>
                            <span className="text-[2.35rem] leading-none font-normal text-[#334155]">/</span>
                            <span className="text-[3rem] leading-none font-normal tracking-tight text-[#334155]">{total}</span>
                        </div>
                        <p className="text-body-sm font-normal text-[#AEB7C5] mt-2">합격 기준: {passCount}개 이상</p>
                        <div className="w-full h-3.5 bg-[#EDF2F7] rounded-full mt-4 overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${passed ? 'bg-gradient-to-r from-[#2DD4BF] to-[#7C83FF]' : 'bg-gradient-to-r from-[#FFB5A8] to-[#FF6B6B]'}`} style={{ width: `${percent}%` }} />
                        </div>
                    </div>

                    {passed && !alreadyUnlocked && (
                        <div className="w-full mt-4 rounded-[1.75rem] bg-[#EFFFFB] border-2 border-[#8FEBDD] px-4 py-3.5 flex items-center justify-center gap-3 shadow-sm">
                            {badgeImage && <img src={badgeImage} alt="" className="w-14 h-14 shrink-0 object-contain" />}
                            <p className="text-[1.35rem] leading-snug font-normal text-[#007C6D] break-keep">{unlockText}</p>
                        </div>
                    )}

                    <ResultModalActions className="mt-5">
                        <CtaButton onClick={() => setShowAnswerReport(true)} theme="indigo">결과 보기</CtaButton>
                        {!passed && <CtaButton onClick={onRetry} theme="coral"><span className="quiz-cta-text">다시 도전</span></CtaButton>}
                        <ResultSecondaryButton onClick={onFinish}>
                            {passed ? '완료' : '돌아가기'}
                        </ResultSecondaryButton>
                        {passed && (
                            <>
                                <ResultShareButton
                                    onClick={handleShare}
                                    title="카카오톡으로 자랑하기"
                                    subtitle={`${grade} 합격 인증서 공유`}
                                />
                                {shareStatus && <p className="text-center text-[11px] text-slate-400 -mt-1.5">{shareStatus}</p>}
                            </>
                        )}
                    </ResultModalActions>
            </ResultModalShell>
        );
    }

    return (
        <div className={`grade-test-report-screen dark:bg-slate-900 ${passed ? 'grade-test-report-screen--pass' : 'grade-test-report-screen--fail'}`}>
            <main className="grade-test-report-shell">
                <button className="grade-test-report-back" onClick={() => setShowAnswerReport(false)}>‹ 점수 화면</button>
                <section className="grade-test-report-hero">
                    <img
                        src={characterImage}
                        alt=""
                        className="grade-test-report-character"
                        style={{ transform: `translateY(${getCharacterTranslateY(selectedCharacter, true)}) scale(${getCharacterScale(selectedCharacter, passed ? 'success' : 'failure')})` }}
                    />
                    <div className="grade-test-report-heading">
                        <span className={`grade-test-report-status ${passed ? 'is-pass' : 'is-fail'}`}>{passed ? '합격' : '재도전'}</span>
                        <h1>{title}</h1>
                        <p>{subtitle}</p>
                    </div>
                    <div className="grade-test-report-score">
                        <strong>{correct}</strong><span>/{total}</span>
                        <small>{percent}점</small>
                    </div>
                </section>

                <section className="grade-test-report-summary">
                    <div><span>정답</span><strong className="is-correct">{correct}</strong></div>
                    <div><span>오답</span><strong className="is-wrong">{wrongCount}</strong></div>
                    <div><span>합격 기준</span><strong>{passCount}</strong></div>
                </section>

                {passed && !alreadyUnlocked && (
                    <section className="grade-test-report-unlock">
                        {badgeImage && <img src={badgeImage} alt="" />}
                        <div><strong>{unlockText}</strong><span>{nextGrade ? `${nextGrade} 시험이 열렸어요` : '모든 급수 인증을 마쳤어요'}</span></div>
                    </section>
                )}

                <section className="grade-test-report-review">
                    <div className="grade-test-report-review-head">
                        <div><span>문제별 결과</span><small>내 답과 정답을 비교해보세요</small></div>
                        <strong>{filteredAnswers.length}문제</strong>
                    </div>
                    <div className="grade-test-report-tabs">
                        <button className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>전체 {answers.length}</button>
                        <button className={filter === 'wrong' ? 'is-active' : ''} onClick={() => setFilter('wrong')}>오답 {wrongCount}</button>
                        <button className={filter === 'correct' ? 'is-active' : ''} onClick={() => setFilter('correct')}>정답 {correct}</button>
                    </div>
                    <div className="grade-test-report-list">
                        {filteredAnswers.map(answer => (
                            <article key={answer.number} className={`grade-test-report-item ${answer.isCorrect ? 'is-correct' : 'is-wrong'}`}>
                                <header>
                                    <span>#{answer.number}</span>
                                    <em>{answer.type}</em>
                                    <strong>{answer.isCorrect ? '정답' : '오답'}</strong>
                                </header>
                                <p className="grade-test-report-question">{answer.prompt}</p>
                                {answer.sentence && <p className="grade-test-report-sentence">{cleanSentence(answer.sentence)}</p>}
                                <div className="grade-test-report-answer-row">
                                    <div><span>내 답</span><strong>{answer.userAnswer}</strong></div>
                                    {!answer.isCorrect && <div><span>정답</span><strong>{answer.correctAnswer}</strong></div>}
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <div className="grade-test-report-actions">
                    <button onClick={onRetry} className="grade-test-report-retry">다시 풀기</button>
                    <CtaButton onClick={onFinish} theme={passed ? 'indigo' : 'coral'}>{passed ? '완료' : '돌아가기'}</CtaButton>
                </div>
            </main>
        </div>
    );
};

export default GradeTestResult;
