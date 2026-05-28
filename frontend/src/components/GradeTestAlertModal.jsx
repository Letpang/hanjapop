import React from 'react';

const GRADE_INFO = {
    '8급':  { screen: 'gradeTest',   emoji: '🏅', color: '#7C83FF', bg: '#F5F5FF' },
    '7급Ⅱ': { screen: 'gradeTest72', emoji: '⚔️', color: '#FF9B73', bg: '#FFF7F3' },
    '7급':  { screen: 'gradeTest7',  emoji: '🌟', color: '#F59E0B', bg: '#FFFBEB' },
    '6급Ⅱ': { screen: 'gradeTest62', emoji: '🔥', color: '#EF4444', bg: '#FEF2F2' },
    '6급':  { screen: 'gradeTest6',  emoji: '👑', color: '#2ED6C5', bg: '#F0FEFA' },
};

export default function GradeTestAlertModal({ grade, onNavigate, onClose }) {
    const info = GRADE_INFO[grade];
    if (!info) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-t-[32px] pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]"
                style={{ background: '#FFFFFF' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-center pt-4 pb-2">
                    <div className="w-12 h-1.5 rounded-full bg-gray-200" />
                </div>

                <div className="px-6 pt-4 pb-6 text-center">
                    <div className="text-5xl mb-3">{info.emoji}</div>
                    <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">
                        {grade} 학습 완료!
                    </h2>
                    <p className="text-sm font-semibold text-slate-400 mt-2">
                        지금까지 배운 한자로 {grade} 시험에 도전해 보세요
                    </p>
                </div>

                <div className="px-6 flex flex-col gap-3">
                    <button
                        onClick={() => { onClose(); onNavigate(info.screen); }}
                        className="w-full py-4 rounded-full font-black text-white text-[17px] transition-transform active:scale-[0.98]"
                        style={{ background: `linear-gradient(135deg, ${info.color}, ${info.color}cc)` }}
                    >
                        {grade} 시험 보러 가기
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-3 text-[14px] text-gray-400 font-medium"
                    >
                        나중에 하기
                    </button>
                </div>
            </div>
        </div>
    );
}
