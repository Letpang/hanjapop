import { useMemo, useState } from 'react';
import { SK } from '../constants/storageKeys.js';
import HANJA_DATA from '../hanja_unified.json';
import { wordById } from '../utils/wordUtils.js';

const hanjaById = Object.fromEntries(HANJA_DATA.map(h => [h.id, h]));

const readStudyLog = () => {
  try { return JSON.parse(localStorage.getItem(SK.STUDY_LOG) || '{}'); } catch { return {}; }
};

const readWordData = () => {
  try { return JSON.parse(localStorage.getItem(SK.WORD_DATA) || '{}'); } catch { return {}; }
};

const collectVocabulary = () => {
  const log = readStudyLog();
  const wordData = readWordData();
  const days = log.days || {};
  const wordIds = new Set();
  const hanjaIds = new Set();

  Object.values(days).forEach(entry => {
    (entry.hanjaIds || []).forEach(id => hanjaIds.add(Number(id)));
    (entry.wordIds || []).forEach(id => wordIds.add(Number(id)));
    (entry.correctWordIds || []).forEach(id => wordIds.add(Number(id)));
    (entry.wrongWordIds || []).forEach(id => wordIds.add(Number(id)));
  });

  Object.keys(wordData).forEach(id => wordIds.add(Number(id)));

  const words = [...wordIds]
    .map(id => {
      const word = wordById[id];
      if (!word) return null;
      const memory = wordData[String(id)] || {};
      const wrongCount = memory.wrongCount || 0;
      const correctCount = memory.correctCount || 0;
      const nextReview = memory.nextReview || null;
      const isDue = nextReview ? new Date(nextReview) <= new Date() : false;
      return {
        ...word,
        wrongCount,
        correctCount,
        nextReview,
        isDue,
      };
    })
    .filter(Boolean)
    .sort((a, b) =>
      Number(b.isDue) - Number(a.isDue) ||
      b.wrongCount - a.wrongCount ||
      a.word.localeCompare(b.word, 'ko')
    );

  const hanjas = [...hanjaIds]
    .map(id => hanjaById[id])
    .filter(Boolean)
    .sort((a, b) => a.id - b.id);

  return { words, hanjas };
};

const FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'wrong', label: '오답' },
];

const VocabularyScreen = ({
  onBack,
  isDarkMode,
  initialFilter = 'all',
  initialTab = 'words',
  title = '단어장',
  subtitle = '학습한 단어와 오답을 모아봐요',
}) => {
  const { words, hanjas } = useMemo(() => collectVocabulary(), []);
  const [tab, setTab] = useState(initialTab);
  const [filter, setFilter] = useState(initialFilter);
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();

  const filteredWords = useMemo(() => {
    return words.filter(item => {
      if (filter === 'wrong' && item.wrongCount <= 0) return false;
      if (!normalizedQuery) return true;
      return [item.word, item.reading, item.meaning, item.hanja]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [words, filter, normalizedQuery]);

  const filteredHanjas = useMemo(() => {
    return hanjas.filter(item => {
      if (!normalizedQuery) return true;
      return [item.hanja, item.sound, item.meaning, item.category]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [hanjas, normalizedQuery]);

  const wrongCount = words.filter(w => w.wrongCount > 0).length;

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-[#F7FAF9] text-[#334155]'}`}>
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-5 px-5 pb-16 pt-4 safe-top">
        <header className={`flex min-h-[64px] items-center justify-between rounded-[2rem] border px-4 shadow-sm ${isDarkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-white'}`}>
          <button
            onClick={onBack}
            className={`h-10 w-10 rounded-2xl border font-black shadow-sm active:scale-95 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-100 text-[#5B677A]'}`}
          >
            ←
          </button>
          <div className="text-center">
            <h2 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>{title}</h2>
            <p className={`text-[11px] font-extrabold ${isDarkMode ? 'text-slate-400' : 'text-[#8D9CAE]'}`}>
              {subtitle}
            </p>
          </div>
          <div className="h-10 w-10" />
        </header>

        <section className={`rounded-[2rem] border p-4 shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-white'}`}>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-[#E8FAF7] px-3 py-3">
              <p className="text-[11px] font-black text-[#00A994]">단어</p>
              <p className="mt-0.5 text-xl font-black text-[#334155]">{words.length}</p>
            </div>
            <div className="rounded-2xl bg-[#FFF1EE] px-3 py-3">
              <p className="text-[11px] font-black text-[#E8664F]">오답</p>
              <p className="mt-0.5 text-xl font-black text-[#334155]">{wrongCount}</p>
            </div>
          </div>
        </section>

        <section className={`rounded-[2rem] border p-4 shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-white'}`}>
          <div className="mb-3 grid grid-cols-2 gap-2 rounded-2xl bg-[#F4F6F8] p-1">
            {[
              { id: 'words', label: '단어' },
              { id: 'hanja', label: '한자' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`rounded-xl px-3 py-2 text-sm font-black transition-all ${tab === item.id ? 'bg-white text-[#334155] shadow-sm' : 'text-[#8D9CAE]'}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="검색"
            className={`mb-3 w-full rounded-2xl border px-4 py-3 text-sm font-bold outline-none ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500' : 'bg-[#F8FAF9] border-slate-100 text-[#334155] placeholder:text-[#AEB7C5]'}`}
          />

          {tab === 'words' && (
            <>
              <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                {FILTERS.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setFilter(item.id)}
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition-all ${filter === item.id ? 'bg-[#334155] text-white' : 'bg-[#F4F6F8] text-[#7A8798]'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                {filteredWords.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-200 py-10 text-center text-sm font-extrabold text-[#AEB7C5]">
                    표시할 단어가 없어요
                  </div>
                ) : filteredWords.map(item => (
                  <div key={item.id} className={`rounded-[1.5rem] border px-4 py-3 ${item.wrongCount > 0 ? 'border-[#FFD4CC] bg-[#FFF7F5]' : 'border-slate-100 bg-white'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-black text-[#334155]">{item.word}</span>
                          <span className="text-xs font-extrabold text-[#94A3B8]">{item.reading}</span>
                        </div>
                        <p className="mt-1 text-sm font-bold text-[#64748B]">{item.meaning}</p>
                      </div>
                      <span className="shrink-0 rounded-xl bg-[#F4F6F8] px-2.5 py-1 text-sm font-black text-[#334155]">{item.hanja}</span>
                    </div>
                    {(item.wrongCount > 0 || item.correctCount > 0) && (
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black">
                        {item.correctCount > 0 && <span className="rounded-full bg-[#E8FAF7] px-2.5 py-1 text-[#00A994]">정답 {item.correctCount}</span>}
                        {item.wrongCount > 0 && <span className="rounded-full bg-[#FFF1EE] px-2.5 py-1 text-[#E8664F]">오답 {item.wrongCount}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'hanja' && (
            <div className="grid grid-cols-2 gap-2">
              {filteredHanjas.length === 0 ? (
                <div className="col-span-2 rounded-[1.5rem] border border-dashed border-slate-200 py-10 text-center text-sm font-extrabold text-[#AEB7C5]">
                  표시할 한자가 없어요
                </div>
              ) : filteredHanjas.map(item => (
                <div key={item.id} className="rounded-[1.5rem] border border-slate-100 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-[#334155]">{item.hanja}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-[#334155]">{item.sound}</p>
                      <p className="truncate text-xs font-bold text-[#94A3B8]">{item.meaning}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default VocabularyScreen;
