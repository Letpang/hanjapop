import VocabularyEmptyState from './VocabularyEmptyState.jsx';
import VocabularyGroupHeader from './VocabularyGroupHeader.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const VocabularyWordList = ({ groups, totalCount }) => {
  const { t } = useLang();

  if (totalCount === 0) {
    return <VocabularyEmptyState>{t('ext_1838')}</VocabularyEmptyState>;
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map(([day, items]) => (
        <div key={day} className="flex flex-col gap-2.5">
          <VocabularyGroupHeader day={day} fallbackLabel={t('ext_1543')} />
          <div className="flex flex-col gap-2">
            {items.map(item => (
              <div
                key={item.id}
                className={`rounded-[1.5rem] border px-4 py-3 ${
                  item.wrongCount > 0
                    ? 'border-[#FFD4CC] bg-[#FFF7F5] dark:border-rose-800/50 dark:bg-rose-950/25'
                    : 'border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-baseline gap-1.5">
                    <span className="hanja-char text-2xl font-normal text-[#334155] dark:text-slate-100">{item.word}</span>
                    <span className="text-lg font-normal text-[#94A3B8]">{item.reading}</span>
                  </div>
                  {item.hanja && (
                    <span className="voca-hanja-badge">
                      {item.hanja}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-lg font-normal leading-relaxed text-[#64748B] dark:text-slate-300">
                  {item.meaning}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VocabularyWordList;