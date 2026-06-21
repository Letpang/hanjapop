import React from 'react';
import CtaButton from './common/CtaButton.jsx';

const GRADE_INFO = {
    '8급':  { screen: 'gradeTest',   theme: 'indigo' },
    '7급Ⅱ': { screen: 'gradeTest72', theme: 'coral'  },
    '7급':  { screen: 'gradeTest7',  theme: 'coral'  },
    '6급Ⅱ': { screen: 'gradeTest62', theme: 'coral'  },
    '6급':  { screen: 'gradeTest6',  theme: 'indigo' },
};

export default function GradeTestAlertModal({ grade, onNavigate, onClose }) {
    const info = GRADE_INFO[grade];
    if (!info) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center modal-dim"
            onClick={onClose}
        >
            <div
                className="mobile-bottom-sheet w-full max-w-md rounded-t-[32px] bg-white dark:bg-slate-800 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.35)]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-center pt-4 pb-2">
                    <div className="w-12 h-1.5 rounded-full bg-gray-200 dark:bg-slate-600" />
                </div>

                <div className="px-6 pt-4 pb-6 text-center">
                    <span className="result-subtitle">{grade} 학습을 마쳤어요</span>
                    <h2 className="result-title result-title--clear text-[1.6rem] mt-1">
                        시험에 도전해볼까요?
                    </h2>
                    <p className="text-sm font-normal text-slate-400 dark:text-slate-300 mt-2">
                        지금까지 배운 한자로 {grade} 시험에 도전해 보세요
                    </p>
                </div>

                <div className="px-6 flex flex-col gap-3">
                    <CtaButton
                        theme={info.theme}
                        onClick={() => { onClose(); onNavigate(info.screen); }}
                    >
                        <span className="quiz-cta-text">{grade} 시험 보러 가기</span>
                    </CtaButton>
                    <button
                        onClick={onClose}
                        className="w-full py-3 text-[14px] text-slate-400 font-normal"
                    >
                        나중에 하기
                    </button>
                </div>
            </div>
        </div>
    );
}
