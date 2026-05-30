import CtaButton from './CtaButton.jsx';
import { getCharacterImage } from '../../utils/rankUtils.js';

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
    const title = passed ? `${grade} 인증 완료!` : '조금 아쉬운 결과예요';
    const subtitle = passed
        ? (nextGrade ? `${nextGrade} 시험에 도전할 수 있어요` : '모든 급수 인증을 마쳤어요')
        : '다시 풀면 충분히 올라갈 수 있어요';
    const unlockText = nextGrade
        ? `${grade} 인증 완료! ${nextGrade} 시험이 열렸어요`
        : `${grade} 인증 완료! 마지막 관문까지 통과했어요`;

    return (
        <div className={`w-full min-h-[100dvh] flex flex-col items-center justify-center px-5 py-8 ${passed ? 'bg-[#E8F8F3]' : 'bg-[#FFF1F1]'}`}>
            <div className="w-full max-w-md rounded-[3rem] bg-white px-7 py-8 shadow-2xl shadow-[rgba(91,103,122,0.14)] flex flex-col items-center text-center">
                <img
                    src={characterImage}
                    alt=""
                    className="w-44 h-44 object-contain mb-2 drop-shadow-[0_18px_28px_rgba(91,103,122,0.12)]"
                />

                <p className="text-body font-black text-[#AEB7C5] mb-2">
                    {passed ? '정말 멋진 결과예요!' : '괜찮아요, 다시 도전해봐요!'}
                </p>
                <h3 className={`text-[2.2rem] leading-tight font-black tracking-tight break-keep ${passed ? 'text-[#FF8F6B]' : 'text-[#FF6B6B]'}`}>
                    {title}
                </h3>
                <p className="text-body font-extrabold text-[#AEB7C5] mt-3 break-keep">
                    {subtitle}
                </p>

                <div className="w-full mt-8 rounded-[2rem] border-4 border-[#E9EDF2] bg-white px-6 py-5 shadow-inner">
                    <div className="flex items-end justify-center gap-2">
                        <span className={`text-[3.5rem] leading-none font-black tracking-tight ${passed ? 'text-[#00A891]' : 'text-[#FF6B6B]'}`}>
                            {correct}
                        </span>
                        <span className="text-[2.8rem] leading-none font-black text-[#334155]">/</span>
                        <span className="text-[3.5rem] leading-none font-black tracking-tight text-[#334155]">
                            {total}
                        </span>
                    </div>
                    <p className="text-body font-black text-[#AEB7C5] mt-3">
                        합격 기준: {passCount}개 이상
                    </p>
                    <div className="w-full h-4 bg-[#EDF2F7] rounded-full mt-5 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${passed ? 'bg-gradient-to-r from-[#2DD4BF] to-[#7C83FF]' : 'bg-gradient-to-r from-[#FFB5A8] to-[#FF6B6B]'}`}
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>

                {passed && !alreadyUnlocked && (
                    <div className="w-full mt-6 rounded-[2rem] bg-[#EFFFFB] border-2 border-[#8FEBDD] px-5 py-4 text-left shadow-sm">
                        <p className="text-body-lg font-black text-[#007C6D] break-keep">
                            {unlockText}
                        </p>
                    </div>
                )}

                <div className="w-full mt-8 flex flex-col gap-3">
                    {!passed && (
                        <CtaButton onClick={onRetry} theme="blue">
                            다시 도전
                        </CtaButton>
                    )}
                    <button
                        onClick={onFinish}
                        className="w-full py-4 rounded-[2rem] bg-white font-black text-body-lg text-[#5B677A] border-2 border-[#E9EDF2] shadow-sm active:scale-95 transition-all"
                    >
                        {passed ? '완료' : '돌아가기'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GradeTestResult;
