import React from 'react';
import { getCharacterTranslateY, getCharacterScale } from '../utils/rankUtils.js';

const QuizProgressBar = ({ current, total, answered = false, completing = false, avatar, fillColor, charType }) => {
    const pct = completing ? 100 : ((current + (answered ? 1 : 0)) / total) * 100;
    return (
        <div className="quiz-progress-track">
            <div
                className="quiz-progress-fill"
                style={{ '--progress': `${pct}%`, ...(fillColor ? { backgroundColor: fillColor } : {}) }}
            />
            {avatar && (
                <div className="quiz-progress-avatar" style={{
                    left: `calc(${pct}% - (${pct / 100} * 2.25rem))`,
                    right: 'auto',
                    transform: 'translateY(-50%)',
                }}>
                    <img src={avatar} className="w-full h-full object-contain" alt="progress-pawn"
                        style={{ transform: `translateY(${getCharacterTranslateY(charType)}) scale(${getCharacterScale(charType, 'rank1') * (charType === 'muzi' ? 1.0 : 1.15)})` }} />
                </div>
            )}
        </div>
    );
};

export default QuizProgressBar;
