import MatchExitConfirmModal from './MatchExitConfirmModal.jsx';
import MatchGameHeader from './MatchGameHeader.jsx';
import GameGradeGrid from '../../shared/GameGradeGrid.jsx';
import GameModeTabs from '../../shared/GameModeTabs.jsx';
import GameStartHero from '../../shared/GameStartHero.jsx';
import GameTopicGrid from '../../shared/GameTopicGrid.jsx';
import { HANJA_DATA } from '../matchGameData.js';
import { useLang } from '../../../../hooks/useLang.js';

export default function MatchStartScreen({
    categories,
    characterAvatar,
    dailyMapNode,
    onBack,
    onExitCancel,
    onExitConfirm,
    onSelectCategory,
    onSelectGrade,
    onSetViewMode,
    onStart,
    selectedCategory,
    selectedCharacter,
    selectedGrade,
    showExitModal,
    unlockedGrades,
    unlockedIds,
    viewMode,
}) {
    const { t } = useLang();

    return (
        <div className="quiz-screen quiz-screen--plain bg-[#F8FAF9] dark:bg-slate-900">
            <MatchGameHeader onBack={onBack} />

            <div className="flex-1 overflow-y-auto pb-6">
                <div className="w-full max-w-xl mx-auto px-4 flex flex-col items-center gap-6 pt-5">
                    <GameModeTabs onViewModeChange={onSetViewMode} viewMode={viewMode} />

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

                    <GameStartHero bubbleText={t('ext_1500')} characterAvatar={characterAvatar} onStart={onStart} />
                </div>
            </div>

            {showExitModal && (
                <MatchExitConfirmModal
                    dailyMapNode={dailyMapNode}
                    onCancel={onExitCancel}
                    onConfirm={onExitConfirm}
                    selectedCharacter={selectedCharacter}
                />
            )}
        </div>
    );
}