import DailyQuizResultOverlay from './quiz-result-overlay/DailyQuizResultOverlay.jsx';
import FullQuizResultOverlay from './quiz-result-overlay/FullQuizResultOverlay.jsx';
import { useLang } from '../../hooks/useLang.js';

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
    retryLabel,
    hideRetry = false,
}) => {
    const { t } = useLang();
    const subtitle = isClear ? completedLabel : t('ext_1793');
    const defaultFailTitle = <> {t('ext_1475')}<br />{t('ext_1691')}</>;

    if (dailyMapNode) {
        return (
            <DailyQuizResultOverlay
                clearTitle={clearTitle}
                clearXp={clearXp}
                correctXp={correctXp}
                dailyMapNode={dailyMapNode}
                defaultFailTitle={defaultFailTitle}
                detailText={detailText}
                failTitle={failTitle}
                isClear={isClear}
                missionXp={missionXp}
                onBack={onBack}
                onNextStage={onNextStage}
                reward={reward}
                scoreNode={scoreNode}
                subtitle={subtitle}
            />
        );
    }

    return (
        <FullQuizResultOverlay
            backLabel={t('ext_1068')}
            clearTitle={clearTitle}
            clearXp={clearXp}
            correctXp={correctXp}
            defaultFailTitle={defaultFailTitle}
            detailText={detailText}
            failTitle={failTitle}
            hideRetry={hideRetry}
            isClear={isClear}
            missionXp={missionXp}
            onBack={onBack}
            onRetry={onRetry}
            retryLabel={retryLabel ?? t('ext_3197')}
            reward={reward}
            scoreNode={scoreNode}
            selectedCharacter={selectedCharacter}
            subtitle={subtitle}
        />
    );
};

export default QuizResultOverlay;