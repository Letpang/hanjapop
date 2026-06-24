import { useMemo, useState } from 'react';
import { SK } from '../constants/storageKeys.js';
import HANJA_DATA from '../hanja_unified.json';
import { wordById } from '../utils/wordUtils.js';
import IDIOMS from '../data/idioms.js';
import DAILY_CURRICULUM from '../data/dailyCurriculum.js';

const hanjaById = Object.fromEntries(HANJA_DATA.map(h => [h.id, h]));

const hanjaIdToDay = {};
DAILY_CURRICULUM.forEach(({ day, hanja }) => {
  hanja.forEach(h => { hanjaIdToDay[h.id] = day; });
});
const IDIOM_WRONG_KEY = 'idiom_wrong_data';

const readStudyLog = () => {
  try { return JSON.parse(localStorage.getItem(SK.STUDY_LOG) || '{}'); } catch { return {}; }
};

const readWordData = () => {
  try { return JSON.parse(localStorage.getItem(SK.WORD_DATA) || '{}'); } catch { return {}; }
};

const readHanjaData = () => {
  try { return JSON.parse(localStorage.getItem(SK.HANJA_DATA) || '{}'); } catch { return {}; }
};

const readIdiomWrongData = () => {
  try { return JSON.parse(localStorage.getItem(IDIOM_WRONG_KEY) || '{}'); } catch { return {}; }
};

const collectVocabulary = () => {
  const log = readStudyLog();
  const wordData = readWordData();
  const hanjaData = readHanjaData();
  const idiomWrongData = readIdiomWrongData();
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
  Object.keys(hanjaData).forEach(id => hanjaIds.add(Number(id)));

  const words = [...wordIds]
    .map(id => {
      const word = wordById[id];
      if (!word) return null;
      const memory = wordData[String(id)] || {};
      const wrongCount = memory.wrongCount || 0;
      const correctCount = memory.correctCount || 0;
      const nextReview = memory.nextReview || null;
      const isDue = nextReview ? new Date(nextReview) <= new Date() : false;
      const lastWrong = memory.lastWrong || null;
      const hanjaId = memory.hanjaId ?? word.hanjaId ?? null;
      const day = hanjaId ? (hanjaIdToDay[hanjaId] ?? null) : null;
      return {
        ...word,
        wrongCount,
        correctCount,
        nextReview,
        isDue,
        lastWrong,
        day,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b.day ?? -1) - (a.day ?? -1));

  const hanjas = [...hanjaIds]
    .map(id => {
      const h = hanjaById[id];
      if (!h) return null;
      const memory = hanjaData[String(id)] || {};
      return {
        ...h,
        wrongCount: memory.wrongCount || 0,
        correctCount: memory.correctCount || 0,
        level: memory.level || 0,
        day: hanjaIdToDay[id] ?? null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b.day ?? -1) - (a.day ?? -1));

  const seenIdioms = new Set();
  const unlockedIdiomsList = [];

  // 이디엄별 관련 한자 전체 수집
  const idiomHanjaMap = {};
  for (const item of HANJA_DATA) {
    if (!hanjaIds.has(item.id)) continue;
    for (const w of (item.words || [])) {
      if (w.type !== 'idiom') continue;
      if (!idiomHanjaMap[w.word]) idiomHanjaMap[w.word] = [];
      idiomHanjaMap[w.word].push({ hanjaChar: item.hanja, hanjaId: item.id });
    }
  }

  for (const [hanjaWord, relatedHanjas] of Object.entries(idiomHanjaMap)) {
    if (seenIdioms.has(hanjaWord)) continue;
    seenIdioms.add(hanjaWord);
    const meta = IDIOMS.find(x => x.hanja === hanjaWord);
    if (meta) unlockedIdiomsList.push({ ...meta, relatedHanjas });
  }

  // Also include any idiom that has a wrong or correct count, just in case
  IDIOMS.forEach(item => {
    const key = item.id || item.hanja;
    const memory = idiomWrongData[key];
    if (memory && (memory.wrongCount > 0 || memory.correctCount > 0)) {
      if (!seenIdioms.has(item.hanja)) {
        seenIdioms.add(item.hanja);
        unlockedIdiomsList.push(item);
      }
    }
  });

  const idioms = unlockedIdiomsList.map(item => {
    const memory = idiomWrongData[item.id || item.hanja] || {};
    const days = (item.relatedHanjas || []).map(h => hanjaIdToDay[h.hanjaId]).filter(Boolean);
    const day = days.length > 0 ? Math.max(...days) : null;
    return {
      ...item,
      wrongCount: memory.wrongCount || 0,
      correctCount: memory.correctCount || 0,
      lastWrongAt: memory.lastWrongAt || null,
      day,
    };
  }).sort((a, b) => (b.day ?? -1) - (a.day ?? -1));

  return { words, hanjas, idioms };
};

const FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'wrong', label: '오답' },
  { id: 'correct', label: '정답' },
];

const VocabularyScreen = ({
  onBack,
  isDarkMode,
  initialFilter = 'all',
  initialTab = 'words',
  title = '단어장',
  subtitle = '학습한 단어와 오답을 모아봐요',
}) => {
  const { words, hanjas, idioms } = useMemo(() => collectVocabulary(), []);
  const [tab, setTab] = useState(initialTab);
  const [filter, setFilter] = useState(initialFilter);
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();

  const filteredWords = useMemo(() => {
    return words.filter(item => {
      if (filter === 'wrong' && item.wrongCount <= 0) return false;
      if (filter === 'correct' && (item.wrongCount > 0 || item.correctCount <= 0)) return false;
      if (!normalizedQuery) return true;
      return [item.word, item.reading, item.meaning, item.hanja]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [words, filter, normalizedQuery]);

  const filteredHanjas = useMemo(() => {
    return hanjas.filter(item => {
      if (filter === 'wrong' && item.wrongCount <= 0) return false;
      if (filter === 'correct' && (item.wrongCount > 0 || (item.correctCount <= 0 && item.level < 1))) return false;
      if (!normalizedQuery) return true;
      return [item.hanja, item.sound, item.meaning, item.category]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [hanjas, filter, normalizedQuery]);

  const filteredIdioms = useMemo(() => {
    return idioms.filter(item => {
      if (filter === 'wrong' && item.wrongCount <= 0) return false;
      if (filter === 'correct' && (item.wrongCount > 0 || item.correctCount <= 0)) return false;
      if (!normalizedQuery) return true;
      return [item.hanja, item.reading, item.meaning, item.grade]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [idioms, filter, normalizedQuery]);

  const groupedWords = useMemo(() => {
    const groups = {};
    filteredWords.forEach(item => {
      const d = item.day ?? 'other';
      if (!groups[d]) groups[d] = [];
      groups[d].push(item);
    });
    return Object.entries(groups).sort((a, b) => {
      if (a[0] === 'other') return 1;
      if (b[0] === 'other') return -1;
      return Number(b[0]) - Number(a[0]);
    });
  }, [filteredWords]);

  const groupedHanjas = useMemo(() => {
    const groups = {};
    filteredHanjas.forEach(item => {
      const d = item.day ?? 'other';
      if (!groups[d]) groups[d] = [];
      groups[d].push(item);
    });
    return Object.entries(groups).sort((a, b) => {
      if (a[0] === 'other') return 1;
      if (b[0] === 'other') return -1;
      return Number(b[0]) - Number(a[0]);
    });
  }, [filteredHanjas]);

  const groupedIdioms = useMemo(() => {
    const groups = {};
    filteredIdioms.forEach(item => {
      const d = item.day ?? 'other';
      if (!groups[d]) groups[d] = [];
      groups[d].push(item);
    });
    return Object.entries(groups).sort((a, b) => {
      if (a[0] === 'other') return 1;
      if (b[0] === 'other') return -1;
      return Number(b[0]) - Number(a[0]);
    });
  }, [filteredIdioms]);

  const wrongCount = words.filter(w => w.wrongCount > 0).length;
  const idiomWrongCount = idioms.filter(w => w.wrongCount > 0).length;
  const totalCount = words.length + idioms.length;
  const correctCount = totalCount - wrongCount - idiomWrongCount;

  return (
    <div className={`vocabulary-screen fixed inset-0 z-50 overflow-y-auto bg-[#F7FAF9] text-[#334155] dark:bg-slate-900 dark:text-white`}>
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-5 px-5 pt-4 safe-top safe-bottom">
        <header className={`flex min-h-[64px] items-center justify-between rounded-[2rem] border px-4 shadow-sm bg-white/90 border-white dark:bg-slate-800/90 dark:border-slate-700`}>
          <button
            onClick={onBack}
            className={`h-10 w-10 rounded-2xl border font-normal shadow-sm active:scale-95 bg-white border-slate-100 text-[#5B677A] dark:bg-slate-700 dark:border-slate-600 dark:text-white`}
          >
            ←
          </button>
          <div className="text-center">
            <h2 className={`text-lg font-medium text-slate-700 dark:text-white`}>{title}</h2>
            <p className={`text-[11px] font-normal text-[#8D9CAE] dark:text-slate-400`}>
              {subtitle}
            </p>
          </div>
          <div className="h-10 w-10" />
        </header>

        <section className={`rounded-[2rem] border p-4 shadow-sm bg-white border-white dark:bg-slate-800 dark:border-slate-700`}>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-[#E8FAF7] dark:bg-teal-950/35 px-3 py-3 flex flex-col items-center text-center">
              <p className="text-[11px] font-normal text-[#00A994]">단어 · 사자성어</p>
              <p className="mt-0.5 text-xl font-normal text-[#334155] dark:text-slate-100">{totalCount}</p>
            </div>
            <div className="rounded-2xl bg-[#FFF1EE] dark:bg-rose-950/30 px-3 py-3 flex flex-col items-center text-center">
              <p className="text-[11px] font-normal text-[#E8664F]">오답</p>
              <p className="mt-0.5 text-xl font-normal text-[#334155] dark:text-slate-100">{wrongCount + idiomWrongCount}</p>
            </div>
            <div className="rounded-2xl bg-[#F5F3FF] dark:bg-indigo-950/35 px-3 py-3 flex flex-col items-center text-center">
              <p className="text-[11px] font-normal text-[#7C83FF]">정답</p>
              <p className="mt-0.5 text-xl font-normal text-[#334155] dark:text-slate-100">{correctCount}</p>
            </div>
          </div>
        </section>

        <section className={`rounded-[2rem] border p-4 shadow-sm bg-white border-white dark:bg-slate-800 dark:border-slate-700`}>
          <div className="mb-3 grid grid-cols-3 gap-2 rounded-2xl bg-[#F4F6F8] dark:bg-slate-900 p-1">
            {[
              { id: 'words', label: '단어' },
              { id: 'hanja', label: '한자' },
              { id: 'idioms', label: '사자성어' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`rounded-xl px-3 py-2 text-sm font-normal transition-all ${tab === item.id ? 'bg-white dark:bg-slate-700 text-[#334155] dark:text-white shadow-sm' : 'text-[#8D9CAE] dark:text-slate-400'}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="검색"
            className={`mb-3 w-full rounded-2xl border px-4 py-3 text-sm font-normal outline-none bg-[#F8FAF9] border-slate-100 text-[#334155] placeholder:text-[#AEB7C5] dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500`}
          />

          {(tab === 'words' || tab === 'hanja' || tab === 'idioms') && (
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {FILTERS.map(item => (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-normal transition-all ${filter === item.id ? 'bg-[#334155] dark:bg-slate-600 text-white' : 'bg-[#F4F6F8] dark:bg-slate-900 text-[#7A8798] dark:text-slate-400'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {tab === 'words' && (
            <div className="flex flex-col gap-5">
              {filteredWords.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 py-10 text-center text-sm font-normal text-[#AEB7C5]">
                  표시할 단어가 없어요
                </div>
              ) : (
                groupedWords.map(([day, items]) => (
                  <div key={day} className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[11px] font-medium text-[#7C83FF] bg-[#EEF0FF] dark:bg-indigo-950/40 dark:text-indigo-300 px-2.5 py-0.5 rounded-full shrink-0">
                        {day === 'other' ? '기타 단어' : `${day}일차`}
                      </span>
                      <div className="h-px flex-1 bg-slate-100 dark:bg-slate-700/60" />
                    </div>
                    <div className="flex flex-col gap-2">
                      {items.map(item => (
                        <div key={item.id} className={`rounded-[1.5rem] border px-4 py-3 ${item.wrongCount > 0 ? 'border-[#FFD4CC] dark:border-rose-800/50 bg-[#FFF7F5] dark:bg-rose-950/25' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-baseline gap-1.5 min-w-0">
                              <span className="text-lg font-normal text-[#334155] dark:text-slate-100">{item.word}</span>
                              <span className="text-sm font-normal text-[#94A3B8]">{item.reading}</span>
                            </div>
                            {item.hanja && <span className="rounded-lg bg-[#F4F6F8] dark:bg-slate-700 px-2 py-0.5 text-sm font-normal text-[#334155] dark:text-slate-100">{item.hanja}</span>}
                          </div>
                          <p className="mt-1 text-base font-normal leading-relaxed text-[#64748B] dark:text-slate-300">{item.meaning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'hanja' && (
            <div className="flex flex-col gap-5">
              {filteredHanjas.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 py-10 text-center text-sm font-normal text-[#AEB7C5]">
                  표시할 한자가 없어요
                </div>
              ) : (
                groupedHanjas.map(([day, items]) => (
                  <div key={day} className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[11px] font-medium text-[#7C83FF] bg-[#EEF0FF] dark:bg-indigo-950/40 dark:text-indigo-300 px-2.5 py-0.5 rounded-full shrink-0">
                        {day === 'other' ? '기타 한자' : `${day}일차`}
                      </span>
                      <div className="h-px flex-1 bg-slate-100 dark:bg-slate-700/60" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {items.map(item => (
                        <div key={item.id} className={`relative rounded-[1.5rem] border px-2 py-3 shadow-sm flex flex-col items-center text-center gap-1 ${item.wrongCount > 0 ? 'border-[#FFD4CC] dark:border-rose-800/50 bg-[#FFF7F5] dark:bg-rose-950/25' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
                          <span className="text-3xl font-normal text-[#334155] dark:text-slate-100">{item.hanja}</span>
                          <p className="text-[13px] font-normal leading-tight text-center px-1">
                            <span className="text-[#94A3B8]">{item.meaning}</span>
                            <span className="text-[#334155] dark:text-slate-200"> {item.sound}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'idioms' && (
            <div className="flex flex-col gap-5">
              {filteredIdioms.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 py-10 text-center text-sm font-normal text-[#AEB7C5]">
                  표시할 사자성어가 없어요
                </div>
              ) : (
                groupedIdioms.map(([day, items]) => (
                  <div key={day} className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[11px] font-medium text-[#7C83FF] bg-[#EEF0FF] dark:bg-indigo-950/40 dark:text-indigo-300 px-2.5 py-0.5 rounded-full shrink-0">
                        {day === 'other' ? '기타 사자성어' : `${day}일차`}
                      </span>
                      <div className="h-px flex-1 bg-slate-100 dark:bg-slate-700/60" />
                    </div>
                    <div className="flex flex-col gap-2">
                      {items.map(item => (
                        <div key={item.id || item.hanja} className={`relative rounded-[1.5rem] border px-4 py-3 ${item.wrongCount > 0 ? 'border-[#FFD4CC] dark:border-rose-800/50 bg-[#FFF7F5] dark:bg-rose-950/25' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="hanja-char text-2xl font-normal tracking-wider text-[#334155] dark:text-slate-100 shrink-0">{item.hanja}</span>
                            <div className="flex items-center gap-1 flex-wrap justify-end">
                              <span className="text-sm font-normal text-[#94A3B8]">{item.reading}</span>
                              {item.relatedHanjas?.map(h => (
                                <span key={h.hanjaChar} className="rounded-lg bg-[#F4F6F8] dark:bg-slate-700 px-1.5 py-0.5 text-xs font-normal text-[#5B677A] dark:text-slate-200">{h.hanjaChar}</span>
                              ))}
                            </div>
                          </div>
                          <p className="mt-1 text-base font-normal leading-relaxed text-[#64748B] dark:text-slate-300 break-keep">{item.meaning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default VocabularyScreen;
