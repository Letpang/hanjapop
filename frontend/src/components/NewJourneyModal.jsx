import React from 'react';
import ResultModalShell, {
    ResultModalActions,
    ResultModalHeading,
    ResultPrimaryButton,
    ResultSecondaryButton,
} from './common/ResultModalShell.jsx';

const NewJourneyModal = ({ nextRound = 2, onBrowseMemory, onStart, onClose }) => (
    <ResultModalShell onBackdropClick={onClose} labelledBy="new-journey-title">
        <div className="flex flex-col items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.65rem] bg-gradient-to-br from-[#FFF4D8] to-[#FFE1B8] text-4xl shadow-inner">
                🧭
            </div>
            <ResultModalHeading
                id="new-journey-title"
                kicker="기억을 품고 다시 출발"
                title={`${nextRound}회차 새 탐험`}
                description={<>지도만 1단계로 돌아가요.<br />지금까지 쌓은 기억과 보상은 그대로 남습니다.</>}
            />

            <div className="grid w-full grid-cols-2 gap-2.5 rounded-[1.5rem] bg-slate-50 p-3 text-center shadow-inner">
                <div className="rounded-[1.15rem] bg-white px-2 py-3.5 shadow-sm">
                    <strong className="block text-[15px] font-medium text-[#2AAFA2]">그대로 보관</strong>
                    <span className="mt-1.5 block text-[13px] leading-snug text-slate-500">XP · 레벨 · 배지<br />오답 · 단어장 · 인증서</span>
                </div>
                <div className="rounded-[1.15rem] bg-white px-2 py-3.5 shadow-sm">
                    <strong className="block text-[15px] font-medium text-[#7C83FF]">새롭게 시작</strong>
                    <span className="mt-1.5 block text-[13px] leading-snug text-slate-500">{nextRound}회차 · 1단계<br />약한 기억 우선 복습</span>
                </div>
            </div>

            <ResultModalActions>
                <ResultPrimaryButton onClick={onStart}>새 탐험 시작하기</ResultPrimaryButton>
                <ResultSecondaryButton onClick={onBrowseMemory}>기억의 저장소 둘러보기</ResultSecondaryButton>
                <button type="button" onClick={onClose} className="py-1 text-[12px] text-slate-400">
                    완주 상태로 더 둘러보기
                </button>
            </ResultModalActions>
        </div>
    </ResultModalShell>
);

export default NewJourneyModal;
