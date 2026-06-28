import VocabularyEmptyState from './VocabularyEmptyState.jsx';
import VocabularyGroupHeader from './VocabularyGroupHeader.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const VocabularyIdiomList = ({ groups, totalCount }) => {
  const { t } = useLang();

  if (totalCount === 0) {
    return <VocabularyEmptyState>{t('ext_1959')}</VocabularyEmptyState>;
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map(([day, items]) => (
        <div key={day} className="flex flex-col gap-2.5">
          <VocabularyGroupHeader day={day} fallbackLabel={t('ext_1650')} />
          <div className="flex flex-col gap-2">
            {items.map(item => (
              <div
                key={item.id || item.hanja}
                className={`relative rounded-[1.5rem] border px-4 py-3 ${
                  item.wrongCount > 0
                    ? 'border-[#FFD4CC] bg-[#FFF7F5] dark:border-rose-800/50 dark:bg-rose-950/25'
                    : 'border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="hanja-char text-3xl font-normal tracking-wider text-[#334155] dark:text-slate-100">
                      {item.hanja}
                    </span>
                    <span className="text-base font-normal text-[#94A3B8]">{item.reading}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
                    {item.relatedHanjas?.map(h => (
                      <span
                        key={`${h.hanjaChar}-${h.hanjaId}`}
                        className="voca-hanja-badge"
                      >
                        {h.hanjaChar}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="mt-1 break-keep text-lg font-normal leading-relaxed text-[#64748B] dark:text-slate-300">
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

export default VocabularyIdiomList;