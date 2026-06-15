import CtaButton from './CtaButton.jsx';
import { getCharacterImage, getCharacterScale, getCharacterTranslateY } from '../../utils/rankUtils.js';

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
    onRetry,
    onFinish,
}) => {
    const percent = total > 0 ? Math.min(100, Math.round((correct / total) * 100)) : 0;
    const characterImage = getCharacterImage(selectedCharacter, passed ? 'success' : 'failure');
    const badgeImage = GRADE_BADGE_IMAGES[grade];
    const title = passed ? `${grade} 인증 완료!` : '조금 아쉬운 결과예요';
    const subtitle = passed
        ? (nextGrade ? `${nextGrade} 시험에 도전할 수 있어요` : '모든 급수 인증을 마쳤어요')
        : '다시 풀면 충분히 올라갈 수 있어요';
    const unlockText = `${grade} 뱃지 획득!`;

    return (
        <div className={`w-full min-h-[100dvh] flex flex-col items-center justify-center px-5 py-4 overflow-hidden ${passed ? 'bg-[#E8F8F3]' : 'bg-[#FFF1F1]'}`}>
            <div className="w-full max-w-md rounded-[2.5rem] bg-white px-6 py-6 shadow-2xl shadow-[rgba(91,103,122,0.14)] flex flex-col items-center text-center">
                <img
                    src={characterImage}
                    alt=""
                    className="w-36 h-36 object-contain mb-1 drop-shadow-[0_18px_28px_rgba(91,103,122,0.12)]"
                    style={{ transform: `translateY(${getCharacterTranslateY(selectedCharacter, true)}) scale(${getCharacterScale(selectedCharacter, passed ? 'success' : 'failure')})` }}
                />

                {!passed && (
                    <p className="text-body-sm font-normal text-[#AEB7C5] mb-1.5">
                        괜찮아요, 다시 도전해봐요!
                    </p>
                )}
                <h3 className={`text-[2rem] leading-tight font-medium tracking-tight break-keep ${passed ? 'text-[#FF8F6B]' : 'text-[#FF6B6B]'}`}>
                    {title}
                </h3>
                <p className="text-body-sm font-normal text-[#AEB7C5] mt-2 break-keep">
                    {subtitle}
                </p>

                <div className="w-full mt-5 rounded-[1.75rem] border-4 border-[#E9EDF2] bg-white px-5 py-4 shadow-inner">
                    <div className="flex items-end justify-center gap-2">
                        <span className={`text-[3rem] leading-none font-normal tracking-tight ${passed ? 'text-[#00A891]' : 'text-[#FF6B6B]'}`}>
                            {correct}
                        </span>
                        <span className="text-[2.35rem] leading-none font-normal text-[#334155]">/</span>
                        <span className="text-[3rem] leading-none font-normal tracking-tight text-[#334155]">
                            {total}
                        </span>
                    </div>
                    <p className="text-body-sm font-normal text-[#AEB7C5] mt-2">
                        합격 기준: {passCount}개 이상
                    </p>
                    <div className="w-full h-3.5 bg-[#EDF2F7] rounded-full mt-4 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${passed ? 'bg-gradient-to-r from-[#2DD4BF] to-[#7C83FF]' : 'bg-gradient-to-r from-[#FFB5A8] to-[#FF6B6B]'}`}
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>

                {passed && !alreadyUnlocked && (
                    <div className="w-full mt-4 rounded-[1.75rem] bg-[#EFFFFB] border-2 border-[#8FEBDD] px-4 py-3.5 flex items-center justify-center gap-3 shadow-sm">
                        {badgeImage && (
                            <img
                                src={badgeImage}
                                alt=""
                                className="w-14 h-14 shrink-0 object-contain drop-shadow-[0_8px_14px_rgba(0,124,109,0.14)]"
                            />
                        )}
                        <p className="text-[1.35rem] leading-snug font-normal text-[#007C6D] break-keep">
                            {unlockText}
                        </p>
                    </div>
                )}

                <div className="w-full mt-5 flex flex-col gap-3">
                    {!passed && (
                        <CtaButton onClick={onRetry} theme="coral">
                            다시 도전
                        </CtaButton>
                    )}
                    <button
                        onClick={onFinish}
                        className="w-full py-4 rounded-[2rem] bg-white font-normal text-body-lg text-[#5B677A] border-2 border-[#E9EDF2] shadow-sm active:scale-95 transition-all"
                    >
                        {passed ? '완료' : '돌아가기'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GradeTestResult;
