import HANJA_DATA from '../../../../hanja_unified.json';
import GameGradeGrid from '../../shared/GameGradeGrid.jsx';
import GameModeTabs from '../../shared/GameModeTabs.jsx';
import GameStartHero from '../../shared/GameStartHero.jsx';
import GameTopicGrid from '../../shared/GameTopicGrid.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const ShootIdleScreen = ({
    onBack,
    viewMode,
    onViewModeChange,
    selectedGrade,
    onSelectGrade,
    unlockedGrades,
    categories,
    selectedCategory,
    onSelectCategory,
    unlockedIds,
    characterAvatar,
    onStartGame,
}) => {
    const { t } = useLang();

    return (
        <div className="quiz-screen quiz-screen--plain bg-[#F8FAF9] dark:bg-slate-900">
            <div className="quiz-header-wrap quiz-header-wrap--sm">
                <div className="quiz-header-card quiz-header-card--wide">
                    <button onClick={onBack} className="hp-nav-button">
                        <span>←</span>
                    </button>
                    <div className="quiz-header-title-area">
                        <h2 className="quiz-screen-title">{t('ext_1573')}</h2>
                        <p className="screen-subtitle">{t('ext_2357')}</p>
                    </div>
                    <div className="w-11" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-6">
                <div className="w-full max-w-xl mx-auto px-4 flex flex-col items-center gap-6 pt-5">
                    <GameModeTabs onViewModeChange={onViewModeChange} viewMode={viewMode} />

                    {viewMode === 'grade' && (
                        <GameGradeGrid
                            onSelectGrade={onSelectGrade}
                            selectedGrade={selectedGrade}
                            unlockedGrades={unlockedGrades}
                        />
                    )}

                    {viewMode === 'topic' && (
                        <GameTopicGrid
                            categories={categories}
                            hanjaItems={HANJA_DATA}
                            onSelectCategory={onSelectCategory}
                            selectedCategory={selectedCategory}
                            unlockedIds={unlockedIds}
                        />
                    )}

                    <GameStartHero bubbleText={t('ext_982')} characterAvatar={characterAvatar} onStart={onStartGame} />
                </div>
            </div>
        </div>
    );
};

export default ShootIdleScreen;