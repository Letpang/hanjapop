import CtaButton from './CtaButton.jsx';

const GradeTestIntro = ({
    title,
    subtitle,
    total,
    passCount,
    focusText,
    hasPrereq = true,
    prereqText,
    alreadyUnlocked = false,
    alreadyUnlockedText,
    onBack,
    onStart,
}) => {
    return (
        <div className="w-full min-h-[100dvh] flex flex-col max-w-screen-xl mx-auto bg-[#F7FAF9]">
            <div className="w-full shrink-0 flex items-center justify-between px-5 pt-8 pb-4 relative">
                <button
                    onClick={onBack}
                    className="hp-nav-button z-10"
                >
                    <span>←</span>
                </button>
                <h2 className="text-[2.35rem] leading-tight font-black text-[#3D4B4A] tracking-tight absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
                    {title}
                </h2>
                <div className="w-11" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 pb-10">
                <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-[2.75rem] border-4 border-white shadow-[0_16px_40px_rgba(120,130,160,0.12)] px-6 py-8 flex flex-col items-center gap-6 text-center">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-white bg-[#FFF5E8] shadow-[0_0_24px_rgba(255,210,120,0.25),inset_0_2px_4px_rgba(255,255,255,0.8)]">
                        <img src="/assets/images/icons/icon_test.webp" alt="" className="w-12 h-12 object-contain" />
                    </div>

                    <div>
                        <h3 className="text-[3rem] leading-tight font-black text-[#2F3545] tracking-tight break-keep">
                            {title}
                        </h3>
                        <p className="text-[1.35rem] leading-snug font-black text-[#AEB7C5] mt-3 break-keep">
                            {subtitle}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5 w-full">
                        <div className="bg-[#F8FAFC] rounded-[1.75rem] px-4 py-5 flex flex-col items-center border-2 border-[#EEF2F7]">
                            <span className="text-[1.1rem] text-[#AEB7C5] font-black tracking-tight">문제 수</span>
                            <span className="text-[2.25rem] leading-tight font-black text-[#334155] mt-2">{total}문항</span>
                        </div>
                        <div className="bg-[#F8FAFC] rounded-[1.75rem] px-4 py-5 flex flex-col items-center border-2 border-[#EEF2F7]">
                            <span className="text-[1.1rem] text-[#AEB7C5] font-black tracking-tight">합격 기준</span>
                            <span className="text-[2.25rem] leading-tight font-black text-[#334155] mt-2">{passCount}개 이상</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2.5 w-full text-left">
                        <div className="rounded-[1.75rem] bg-[#F7FAF9] px-5 py-4 border-2 border-[#EEF2F7]">
                            <p className="text-[1.45rem] leading-snug font-black text-[#334155] break-keep">
                                {focusText}
                            </p>
                        </div>
                        {!hasPrereq && (
                            <div className="rounded-[1.75rem] bg-[#FFF8EA] px-5 py-4 border-2 border-[#FFE2A8]">
                                <p className="text-[1.2rem] leading-snug font-black text-[#D99119] break-keep">
                                    {prereqText}
                                </p>
                            </div>
                        )}
                        {alreadyUnlocked && (
                            <div className="rounded-[1.75rem] bg-[#FFF1EE] px-5 py-4 border-2 border-[#FFD4CC]">
                                <p className="text-[1.2rem] leading-snug font-black text-[#FF7B5F] break-keep">
                                    {alreadyUnlockedText}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full max-w-md flex flex-col gap-3">
                    <CtaButton onClick={onStart} theme="blue">
                        시험 시작
                    </CtaButton>
                    <button
                        onClick={onBack}
                        className="w-full py-4 rounded-[2rem] bg-white font-black text-body-lg text-[#5B677A] border-2 border-[#E9EDF2] shadow-sm active:scale-95 transition-all"
                    >
                        돌아가기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GradeTestIntro;
