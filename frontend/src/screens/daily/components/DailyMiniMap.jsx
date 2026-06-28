import { useLang } from '../../../hooks/useLang.js';

const DailyMiniMap = ({ currentStepIndex, chosenQuiz, chosenGame }) => {
    const { t } = useLang();
    const quizLabel = chosenQuiz === 'wordQuiz'
        ? t('ext_1492')
        : chosenQuiz === 'sentenceQuiz'
            ? t('ext_1493')
            : t('ext_1572');
    const quizIcon = chosenQuiz === 'wordQuiz'
        ? '/assets/images/icons/words.webp'
        : chosenQuiz === 'sentenceQuiz'
            ? '/assets/images/icons/sentence.webp'
            : '/assets/images/icons/words.webp';
    const gameLabel = chosenGame === 'shoot'
        ? t('ext_1573')
        : chosenGame === 'match'
            ? t('ext_1574')
            : t('ext_1575');
    const gameIcon = chosenGame === 'shoot'
        ? '/assets/images/icons/monster.webp'
        : chosenGame === 'match'
            ? '/assets/images/icons/matching.webp'
            : '/assets/images/icons/monster.webp';
    const mapSteps = [
        { label: t('ext_1494'), icon: '/assets/images/icons/study.webp', color: '#7C83FF' },
        { label: quizLabel, icon: quizIcon, color: '#FF9B73' },
        { label: gameLabel, icon: gameIcon, color: '#2ED6C5' },
    ];

    return (
        <div className="w-full relative z-10 mt-7 px-6 mb-3">
            <div className="flex items-start justify-between w-full min-w-0">
                {mapSteps.flatMap((s, i) => {
                    const isDone = i <= currentStepIndex;
                    const els = [
                        <div key={`step-${i}`} className={`flex flex-col items-center gap-1.5 shrink-0 ${isDone ? '' : 'opacity-50 grayscale'}`}>
                            <div className="relative w-12 h-12 rounded-[1rem] flex items-center justify-center shadow-md border-[2px] border-[var(--color-border-subtle)]"
                                style={{ background: isDone ? s.color + '22' : '#f1f5f9' }}>
                                <img src={s.icon} className="w-7 h-7 object-contain" alt={s.label} />
                                {isDone && (
                                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-base font-normal shadow-md border-2 border-[var(--color-border-subtle)]"
                                        style={{ background: '#FF9B73' }}>✓</div>
                                )}
                            </div>
                            <span className="text-base font-normal text-[color:var(--color-text-muted)] dark:text-slate-300 text-center leading-tight max-w-[80px] break-normal hyphens-none">{s.label}</span>
                        </div>,
                    ];
                    if (i < mapSteps.length - 1) {
                        const connColor = isDone ? s.color : '#e2e8f0';
                        const nextColor = (i + 1) <= currentStepIndex ? mapSteps[i + 1].color : '#e2e8f0';
                        els.push(
                            <div key={`conn-${i}`} className="flex-1 min-w-0 flex items-center mx-1" style={{ marginTop: '24px' }}>
                                <div className="h-[3px] w-full rounded-full" style={{ background: `linear-gradient(90deg, ${connColor}, ${nextColor})`, opacity: 0.4 }} />
                            </div>
                        );
                    }
                    return els;
                })}
            </div>
        </div>
    );
};

export default DailyMiniMap;