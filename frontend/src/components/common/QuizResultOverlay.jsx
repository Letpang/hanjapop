import { getCharacterImage, getCharacterScale, getCharacterTranslateY } from '../../utils/rankUtils.js';
import CtaButton from './CtaButton.jsx';
import RewardBreakdown from './RewardBreakdown.jsx';

/**
 * 퀴즈 결과 오버레이 공통 컴포넌트.
 * quiz-screen div가 언마운트되지 않도록 항상 부모 return 안에서 렌더링할 것.
 *
 * dailyMapNode 있음: daily-session-result-backdrop (지도 포함)
 * dailyMapNode 없음: fixed fullscreen gradient (캐릭터 + 점수 + 버튼)
 */
const QuizResultOverlay = ({
    isClear,
    completedLabel,       // '단어 퀴즈 완료!' — isClear 시 subtitle
    clearTitle,           // ReactNode — isClear 시 h1
    failTitle,            // ReactNode — !isClear 시 h1, 기본: 괜찮아요,\n다시 도전해봐요!
    scoreNode,            // ReactNode — 점수/진행 텍스트
    selectedCharacter,
    dailyMapNode,
    reward,
    correctXp,
    clearXp,
    detailText,
    missionXp = 0,
    onRetry,              // 다시 풀기 핸들러 (없으면 버튼 미표시)
    onBack,               // 돌아가기 / 일반 모드 CTA
    onNextStage,          // dailyMapNode 모드 CTA (없으면 onBack 사용)
    retryLabel = '다시 풀기',
    backLabel = '돌아가기',
    hideRetry = false,
}) => {
    const subtitle = isClear ? completedLabel : '아쉬운 결과네요...';
    const defaultFailTitle = <>괜찮아요,<br />다시 도전해봐요!</>;

    if (dailyMapNode) {
        return (
            <div className={`daily-session-result-backdrop${isClear ? '' : ' daily-session-result-backdrop--fail'}`}>
                <div className="mobile-modal-card w-full max-w-sm flex flex-col items-center rounded-[2.5rem] bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative animate-in zoom-in-95 duration-200">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#2ED6C5] dark:bg-[#14b8a6] rounded-full blur-[80px] opacity-20 dark:opacity-10 pointer-events-none" />
                    <div className="pt-10 pb-8 px-7 flex flex-col items-center gap-6 w-full relative z-10">
                        <div className="text-center flex flex-col gap-1 w-full">
                            <span className="result-subtitle">{subtitle}</span>
                            <h1 className={`text-3xl leading-tight mt-1 result-title ${isClear ? 'result-title--clear' : 'result-title--fail'}`}>
                                {isClear ? clearTitle : (failTitle || defaultFailTitle)}
                            </h1>
                            {scoreNode && (
                                <p className="body-muted break-keep mt-2">{scoreNode}</p>
                            )}
                        </div>
                        <div className="w-full">{dailyMapNode}</div>
                        <RewardBreakdown
                            reward={reward}
                            correctXp={correctXp}
                            clearXp={clearXp}
                            detailText={detailText}
                            missionXp={missionXp}
                        />
                        <div className="w-full mt-3">
                            <CtaButton theme="coral" onClick={onNextStage || onBack}>
                                <span className="quiz-cta-text">다음 단계로 이동</span>
                                <span className="quiz-cta-text ml-2">›</span>
                            </CtaButton>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`quiz-result-overlay fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300 ${isClear ? 'quiz-result-overlay--clear' : 'quiz-result-overlay--fail'}`}
        >
            <div className="activity-result-card result-balanced-card">
                <div className="result-balanced-body px-6 flex flex-col items-center w-full relative">
                    <div className="activity-result-glow" />
                    <img
                        src={getCharacterImage(selectedCharacter, isClear ? 'success' : 'failure')}
                        alt={isClear ? 'clear' : 'fail'}
                        className="activity-result-char img-shadow-lg"
                        style={{ transform: `translateY(${getCharacterTranslateY(selectedCharacter, true)}) scale(${getCharacterScale(selectedCharacter, isClear ? 'success' : 'failure')})` }}
                    />
                    <div className="result-text-area result-balanced-content-stack">
                        <span className="result-subtitle">{subtitle}</span>
                        <h1 className={`text-h2-res leading-snug result-title ${isClear ? 'result-title--clear' : 'result-title--fail'}`}>
                            {isClear ? clearTitle : (failTitle || defaultFailTitle)}
                        </h1>
                        {scoreNode && (
                            <p className="body-muted break-keep">{scoreNode}</p>
                        )}
                    </div>
                    <div className="result-balanced-lower-stack">
                        <RewardBreakdown
                            reward={reward}
                            correctXp={correctXp}
                            clearXp={clearXp}
                            detailText={detailText}
                            missionXp={missionXp}
                        />
                    </div>
                    <div className="result-btn-area result-balanced-lower-stack">
                        {!hideRetry && onRetry && (
                            <CtaButton theme="coral" onClick={onRetry}>
                                <span className="quiz-cta-text">{retryLabel}</span>
                            </CtaButton>
                        )}
                        <button onClick={onBack} className="back-quiz-button">
                            {backLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizResultOverlay;
