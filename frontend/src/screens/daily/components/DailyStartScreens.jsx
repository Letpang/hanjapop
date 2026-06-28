import { useMemo } from 'react';
import DailyIntroCta from './DailyIntroCta.jsx';
import DailyIntroPanel from './DailyIntroPanel.jsx';
import DailyPickScreen from './DailyPickScreen.jsx';
import { GAMES, QUIZZES } from './dailyStartOptions.js';
import { useLang } from '../../../hooks/useLang.js';

export const IntroScreen = ({ dayNumber, theme, todayHanja, onBack, onStart, resumeStep }) => {
    const { t } = useLang();

    const buttonContent = useMemo(() => {
        if (resumeStep !== 'flashcard') {
            return {
                title: t('ext_1663'),
                subtitle: t('ext_2050')
            };
        }
        return {
            title: t('ext_1628'),
            subtitle: t('ext_1920')
        };
    }, [resumeStep, t]);

    return (
        <div className="daily-mobile-screen daily-intro-screen fixed inset-0  flex flex-col items-center px-2">
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#2ED6C5] blur-[100px] opacity-15 pointer-events-none" />
            <div className="absolute -bottom-24 right-0 w-96 h-96 rounded-full bg-[#FF9B73] blur-[100px] opacity-15 pointer-events-none" />

            <button onClick={onBack}
                className="hp-nav-button absolute left-5 top-12 z-10">
                ←
            </button>

            <DailyIntroPanel dayNumber={dayNumber} theme={theme} todayHanja={todayHanja} />
            <DailyIntroCta buttonContent={buttonContent} onStart={onStart} />
        </div>
    );
};

export const GamePickScreen = ({ onResult, onBack }) => {
    const { t } = useLang();
    return (
        <DailyPickScreen
            accent="#2ED6C5"
            onBack={onBack}
            onResult={onResult}
            options={GAMES}
            salt="game"
            title={t('ext_1575')}
        />
    );
};

export const QuizPickScreen = ({ onResult, onBack }) => {
    const { t } = useLang();
    return (
        <DailyPickScreen
            accent="#7C83FF"
            onBack={onBack}
            onResult={onResult}
            options={QUIZZES}
            salt="quiz"
            title={t('ext_1572')}
        />
    );
};