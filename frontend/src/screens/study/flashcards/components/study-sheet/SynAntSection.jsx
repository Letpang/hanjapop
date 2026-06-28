import { HANJA_MAP } from '../../flashcardData.js';
import CollapsibleSection from './CollapsibleSection.jsx';
import { useLang } from '../../../../../hooks/useLang.js';

const TermChip = ({ entry, type }) => {
  const { t } = useLang();
  const hanja = typeof entry === 'string' ? entry : entry.hanja;
  const detail = typeof entry === 'object' ? entry : HANJA_MAP[hanja];
  const isAnt = type === 'ant';

  return (
    <div key={hanja} className={isAnt ? 'ant-chip' : 'syn-chip'}>
      <span className={`hanja-char text-h3 font-normal ${isAnt ? 'text-[#FF8D72]' : 'text-[#7C83FF]'}`}>
        {hanja}
      </span>
      {detail && (
        <span className="syn-ant-detail font-normal text-[#9AA4B5]">
          {detail.meaning} {detail.sound}
        </span>
      )}
    </div>
  );
};

const TermGroup = ({ title, colorClass, items, type }) => {
  const { t } = useLang();
  return (
    <div className="minimal-card-studio flex flex-col gap-4 border border-[#E9EDF2] bg-white p-5 shadow-sm !rounded-[2.5rem] dark:bg-slate-800">
      <div className="flex items-center gap-2 px-1">
        <div className={`h-4 w-1.5 rounded-full ${colorClass}`} />
        <span className={`syn-ant-group-title font-semibold ${type === 'ant' ? 'text-[#E06D53] dark:text-[#FF8D72]' : 'text-[#4F56D9] dark:text-[#7C83FF]'}`}>
          {title}
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        {items.map(entry => <TermChip key={typeof entry === 'string' ? entry : entry.hanja} entry={entry} type={type} />)}
      </div>
    </div>
  );
};

const SynAntSection = ({ item, isOpen, onToggle }) => {
  const { t } = useLang();
  const hasSynAnt = (item.syn && item.syn.length > 0) || (item.ant && item.ant.length > 0);
  if (!hasSynAnt) return null;

  return (
    <CollapsibleSection title={t('ext_1734')} isOpen={isOpen} onToggle={onToggle}>
      {item.syn && item.syn.length > 0 && (
        <TermGroup title={t('ext_1835')} colorClass="bg-[#7C83FF]" items={item.syn} type="syn" />
      )}
      {item.ant && item.ant.length > 0 && (
        <TermGroup title={t('ext_1784')} colorClass="bg-[#FF8D72]" items={item.ant} type="ant" />
      )}
    </CollapsibleSection>
  );
};

export default SynAntSection;
