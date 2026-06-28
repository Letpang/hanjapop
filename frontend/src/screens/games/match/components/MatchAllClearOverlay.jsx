import CtaButton from '../../../../components/common/CtaButton.jsx';
import { getCharacterImage, getCharacterScale, getCharacterTranslateY } from '../../../../utils/rankUtils.js';
import { GRADE_LABELS } from '../matchGameData.js';
import { useLang } from '../../../../hooks/useLang.js';

export default function MatchAllClearOverlay({
    contentPool,
    onBack,
    onReset,
    selectedCategory,
    selectedCharacter,
    selectedGrade,
    totalRounds,
    viewMode,
}) {
    const { t } = useLang();
    const title = viewMode === 'grade'
        ? GRADE_LABELS[selectedGrade]
        : viewMode === 'topic'
            ? selectedCategory
            : '';

    return (
        <div
            className="game-state-overlay fixed inset-0 flex flex-col items-center justify-center p-6 z-[100] backdrop-blur-md"
            style={{ background: 'rgba(255,245,200,0.35)' }}
        >
            <div className="premium-card-base p-12 flex flex-col items-center gap-8 max-w-md w-full bg-[var(--color-bg-surface)] border-[#E9EDF2] shadow-2xl !rounded-2xl animate-in zoom-in duration-500 relative overflow-hidden">
                <img
                    src={getCharacterImage(selectedCharacter, 'success')}
                    alt="great"
                    className="w-28 h-28 object-contain animate-bounce drop-shadow-xl relative z-10"
                    style={{ transform: `translateY(${getCharacterTranslateY(selectedCharacter)}) scale(${getCharacterScale(selectedCharacter, 'success')})` }}
                />
                <div className="flex flex-col items-center gap-2 text-center relative z-10">
                    <h2 className="text-h2-res font-medium tracking-normaler" style={{ color: '#FF9B73' }}>
                        {title} {t('ext_1063')}!
                    </h2>
                    <p className="text-[#AEB7C5] font-normal text-base mt-2">{t('ext_2578', { totalRounds })}</p>
                </div>
                <CtaButton
                    theme="indigo"
                    onClick={contentPool ? onBack : onReset}
                    className="relative z-10"
                >
                    <span className="quiz-cta-text">{t('ext_1765')}</span>
                </CtaButton>
            </div>
        </div>
    );
}
