import VocabularyEmptyState from './VocabularyEmptyState.jsx';
import VocabularyGroupHeader from './VocabularyGroupHeader.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const VocabularyHanjaList = ({ groups, totalCount }) => {
  const { t } = useLang();

  if (totalCount === 0) {
    return <VocabularyEmptyState>{t('ext_1837')}</VocabularyEmptyState>;
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map(([day, items]) => (
        <div key={day} className="flex flex-col gap-2.5">
          <VocabularyGroupHeader day={day} fallbackLabel={t('ext_1542')} />
          <div className="grid grid-cols-3 gap-2">
            {items.map(item => (
              <div
                key={item.id}
                className={`relative flex flex-col items-center gap-1 rounded-[1.5rem] border px-2 py-3 text-center shadow-sm ${
                  item.wrongCount > 0
                    ? 'border-[#FFD4CC] bg-[#FFF7F5] dark:border-rose-800/50 dark:bg-rose-950/25'
                    : 'border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-900'
                }`}
              >
                <span className="text-4xl font-normal text-[#334155] dark:text-slate-100">{item.hanja}</span>
                <p className="px-1 text-center text-lg font-normal leading-tight">
                  <span className="text-[#94A3B8]">{item.meaning}</span>
                  <span className="text-[#334155] dark:text-slate-200"> {item.sound}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VocabularyHanjaList;