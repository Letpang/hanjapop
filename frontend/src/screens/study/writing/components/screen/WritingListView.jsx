import WritingHanjaCard from '../WritingHanjaCard.jsx';
import { useLang } from '../../../../../hooks/useLang.js';

const WritingListView = ({ displayList, completedIds, onCardClick }) => {
  const { t } = useLang();

  return (
    <div className="flex w-full flex-col pb-20 animate-in slide-in-from-bottom-4 fade-in duration-500">
      {displayList.length > 0 ? (
        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3">
          {displayList.map(item => (
            <WritingHanjaCard
              key={item.id}
              item={item}
              isCompleted={completedIds.has(item.id)}
              onClick={() => onCardClick(item)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <span className="text-4xl">📚</span>
          <p className="break-keep text-center font-normal text-[#AEB7C5]">{t('ext_2366')}</p>
        </div>
      )}
    </div>
  );
};

export default WritingListView;