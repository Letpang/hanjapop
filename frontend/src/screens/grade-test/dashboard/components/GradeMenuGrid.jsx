import StudyIcon from './StudyIcon.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const GradeMenuGrid = ({ normalizedGrade, theme, isUnlocked, menuItems, onAction }) => {
  const { t } = useLang();
  
  return (
    <section className="shrink-0 flex flex-col gap-3">
      <div className="flex items-end justify-between px-1">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-normal">{t('ext_1584')}</h2>
        <p className="text-base text-slate-400">{t('ext_2513', { normalizedGrade })}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {menuItems.map((item) => (
          <button
            key={item.type}
            onClick={() => onAction(item.action)}
            className="grade-study-menu-card min-h-[116px] rounded-3xl border border-slate-200/70 dark:border-slate-700 p-4 text-left relative flex flex-col items-start"
            style={{ '--menu-soft': theme.bgLight, '--menu-accent': theme.accentDeep }}
          >
            {!isUnlocked && <StudyIcon type="lock" className="absolute top-4 right-4 w-3.5 h-3.5 text-slate-400" />}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 shrink-0"
              style={{ backgroundColor: theme.bgLight, color: theme.accentDeep }}
            >
              <StudyIcon type={item.type} />
            </div>
            <div className="mt-auto">
              <p className="text-lg leading-tight font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
              <p className="text-base leading-snug text-slate-500 dark:text-slate-400 mt-1.5">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default GradeMenuGrid;