import { TopicCard } from '../../../components/GradeGrid.jsx';
import { CATEGORY_IMAGES, categoryLabel } from '../../../constants/hanjaConstants.js';
import { useLang } from '../../../hooks/useLang.js';

const GameTopicGrid = ({ categories, hanjaItems, onSelectCategory, selectedCategory, unlockedIds }) => {
  const { t } = useLang();

  return (
    <div className="grid grid-cols-2 gap-4 w-full animate-in fade-in duration-500">
      {categories.map((category) => (
        <TopicCard
          key={category}
          name={categoryLabel(category, t)}
          imgSrc={CATEGORY_IMAGES[category] ? `/assets/images/hanja_all/${CATEGORY_IMAGES[category]}` : null}
          count={`${hanjaItems.filter((hanja) => hanja.category === category).length}${t('ext_231')}`}
          isSelected={selectedCategory === category}
          onClick={() => onSelectCategory(category)}
          locked={!hanjaItems.some((hanja) => hanja.category === category && unlockedIds.has(hanja.id))}
        />
      ))}
    </div>
  );
};

export default GameTopicGrid;