import { useMemo, useState } from 'react';
import { SK } from '../constants/storageKeys.js';
import HANJA_DATA from '../hanja_unified.json';
import { wordById } from '../utils/wordUtils.js';

const hanjaById = Object.fromEntries(HANJA_DATA.map(h => [h.id, h]));

const toDateStr = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const todayStr = toDateStr(new Date());

const activityLabels = {
  flashcard: '한자 학습지',
  wordQuiz: '단어 퀴즈',
  sentenceQuiz: '문장 퀴즈',
  matchGame: '메모리 게임',
  shootGame: '몬스터 슈팅',
  writing: '한자 획순',
};

const graphTabs = [
  { id: 'questions', label: '문제' },
  { id: 'xp', label: 'XP' },
  { id: 'words', label: '한자·단어' },
  { id: 'wrong', label: '오답' },
];

const readStudyLog = () => {
  try { return JSON.parse(localStorage.getItem(SK.STUDY_LOG) || '{}'); } catch { return {}; }
};

const readMissionHistory = () => {
  try { return JSON.parse(localStorage.getItem(SK.MISSION_HISTORY) || '{}'); } catch { return {}; }
};

const readStreak = () => {
  try { return JSON.parse(localStorage.getItem('streak_data') || '{}').count || 0; } catch { return 0; }
};

const uniqueById = (items) => {
  const seen = new Set();
  return items.filter(item => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const countActivity = (entry = {}, type) =>
  (entry.activities || []).filter(activity => activity === type).length;

const getUniqueWordCount = (entry = {}) =>
  new Set([
    ...(entry.wordIds || []),
    ...(entry.correctWordIds || []),
    ...(entry.wrongWordIds || []),
  ].map(Number).filter(Number.isFinite)).size;

const getGraphStats = (entry = {}) => ({
  flashcard: countActivity(entry, 'flashcard'),
  wordQuiz: countActivity(entry, 'wordQuiz'),
  sentenceQuiz: countActivity(entry, 'sentenceQuiz'),
  xp: Number(entry.xp || 0),
  hanja: new Set((entry.hanjaIds || []).map(Number).filter(Number.isFinite)).size,
  words: getUniqueWordCount(entry),
  wrong: new Set((entry.wrongWordIds || []).map(Number).filter(Number.isFinite)).size,
});

const getRecentDates = (count = 14) => {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, idx) => {
    const d = new Date(base);
    d.setDate(base.getDate() - (count - idx - 1));
    return toDateStr(d);
  });
};

const getEntrySummary = (entry = {}, missions = []) => {
  const hanjas = uniqueById((entry.hanjaIds || []).map(id => hanjaById[id]).filter(Boolean));
  const correctWords = uniqueById((entry.correctWordIds || []).map(id => wordById[id]).filter(Boolean));
  const wrongWords = uniqueById((entry.wrongWordIds || []).map(id => wordById[id]).filter(Boolean));
  const seenWords = uniqueById((entry.wordIds || []).map(id => wordById[id]).filter(Boolean));
  const activitySet = new Set(entry.activities || []);
  missions.forEach(type => activitySet.add(type));

  return {
    hanjas,
    correctWords,
    wrongWords,
    seenWords,
    activities: [...activitySet].filter(Boolean),
    totalCount: hanjas.length + correctWords.length + wrongWords.length + seenWords.length,
  };
};

const DetailSection = ({ title, count, tone = 'slate', children }) => {
  const [open, setOpen] = useState(false);
  const toneClasses = {
    teal: 'text-[#00A994] bg-[#E8FAF7]',
    coral: 'text-[#E8664F] bg-[#FFF1EE]',
    amber: 'text-[#B7791F] bg-[#FFF7D6]',
    slate: 'text-[#5D677A] bg-[#F4F6F8]',
  };

  return (
    <section className="flex flex-col gap-2.5">
      <button className="flex items-center justify-between w-full active:opacity-70 transition-opacity" onClick={() => setOpen(v => !v)}>
        <h3 className="text-sm font-medium text-[#334155]">{title}</h3>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-normal ${toneClasses[tone]}`}>
            {count}개
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} style={{ color: '#FF8D7E' }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </button>
      {open && children}
    </section>
  );
};

const StackedBar = ({ item, max }) => {
  const total = item.flashcard + item.wordQuiz + item.sentenceQuiz;
  const height = total ? Math.max(12, Math.round((total / max) * 96)) : 6;
  const flash = total ? (item.flashcard / total) * 100 : 0;
  const word = total ? (item.wordQuiz / total) * 100 : 0;
  const sentence = Math.max(0, 100 - flash - word);

  return (
    <div className="flex h-32 min-w-0 flex-col items-center justify-end gap-1">
      <div className="flex w-[68%] max-w-[18px] flex-col-reverse overflow-hidden rounded-t-xl rounded-b-md bg-[#EDF2F7]" style={{ height }}>
        {item.flashcard > 0 && <span className="w-full bg-[#2ED6C5]" style={{ height: `${flash}%` }} />}
        {item.wordQuiz > 0 && <span className="w-full bg-[#7C83FF]" style={{ height: `${word}%` }} />}
        {item.sentenceQuiz > 0 && <span className="w-full bg-[#FF9B73]" style={{ height: `${sentence}%` }} />}
      </div>
      <span className="block h-4 text-[9px] font-normal leading-4 text-[#AEB7C5]">{item.shortLabel}</span>
    </div>
  );
};

const SimpleBars = ({ items, valueKey, color, max }) => (
  <div className="grid h-36 items-end gap-1" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
    {items.map(item => {
      const value = item[valueKey] || 0;
      const height = value ? Math.max(10, Math.round((value / max) * 104)) : 6;
      return (
        <div key={item.date} className="flex min-w-0 flex-col items-center justify-end gap-1">
          <div className="w-[68%] max-w-[18px] rounded-t-xl rounded-b-md" style={{ height, background: value ? color : '#EDF2F7' }} />
          <span className="block h-4 text-[9px] font-normal leading-4 text-[#AEB7C5]">{item.shortLabel}</span>
        </div>
      );
    })}
  </div>
);

const DoubleBars = ({ items, max }) => (
  <div className="grid h-36 items-end gap-1" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
    {items.map(item => {
      const hanjaHeight = item.hanja ? Math.max(10, Math.round((item.hanja / max) * 104)) : 6;
      const wordHeight = item.words ? Math.max(10, Math.round((item.words / max) * 104)) : 6;
      return (
        <div key={item.date} className="flex min-w-0 flex-col items-center justify-end gap-1">
          <div className="flex items-end gap-0.5">
            <div className="w-1.5 rounded-t-lg rounded-b-sm bg-[#2ED6C5]" style={{ height: hanjaHeight, opacity: item.hanja ? 1 : 0.16 }} />
            <div className="w-1.5 rounded-t-lg rounded-b-sm bg-[#7C83FF]" style={{ height: wordHeight, opacity: item.words ? 1 : 0.16 }} />
          </div>
          <span className="block h-4 text-[9px] font-normal leading-4 text-[#AEB7C5]">{item.shortLabel}</span>
        </div>
      );
    })}
  </div>
);

const StudyGraph = ({ days, isDarkMode }) => {
  const [tab, setTab] = useState('questions');
  const items = useMemo(() => getRecentDates(14).map(date => {
    const stats = getGraphStats(days[date] || {});
    const day = Number(date.slice(-2));
    return {
      date,
      shortLabel: day % 2 === 0 ? `${day}` : '',
      totalQuestions: stats.flashcard + stats.wordQuiz + stats.sentenceQuiz,
      ...stats,
    };
  }), [days]);

  const totals = items.reduce((acc, item) => ({
    questions: acc.questions + item.totalQuestions,
    xp: acc.xp + item.xp,
    hanja: acc.hanja + item.hanja,
    words: acc.words + item.words,
    wrong: acc.wrong + item.wrong,
  }), { questions: 0, xp: 0, hanja: 0, words: 0, wrong: 0 });

  const maxQuestions = Math.max(1, ...items.map(item => item.totalQuestions));
  const maxXp = Math.max(1, ...items.map(item => item.xp));
  const maxWords = Math.max(1, ...items.map(item => Math.max(item.hanja, item.words)));
  const maxWrong = Math.max(1, ...items.map(item => item.wrong));

  return (
    <section className={`rounded-[2rem] border p-5 shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-white'}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-normal tracking-wider text-[#8D9CAE]">최근 14일</p>
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-[#334155]'}`}>학습 그래프</h3>
        </div>
        <div className="rounded-2xl bg-[#F8FAF9] px-3 py-2 text-right">
          <p className="text-[10px] font-normal text-[#8D9CAE]">총 학습 문제</p>
          <p className="text-base font-normal text-[#00A994]">{totals.questions}문제</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-1.5 rounded-2xl bg-[#F4F7F8] p-1.5">
        {graphTabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`h-9 rounded-xl text-xs font-normal transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00C7AE]/30 ${tab === id ? 'bg-white text-[#00A994] shadow-sm' : 'text-[#8D9CAE]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'questions' && (
        <>
          <div className="rounded-[1.5rem] bg-[#FBFCFD] px-3 py-4">
            <div className="grid h-36 items-end gap-1" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
              {items.map(item => <StackedBar key={item.date} item={item} max={maxQuestions} />)}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-normal text-center">
            <span className="rounded-xl bg-[#E8FAF7] px-2 py-2 text-[#00A994]">학습지 {items.reduce((sum, item) => sum + item.flashcard, 0)}</span>
            <span className="rounded-xl bg-[#F0EFFF] px-2 py-2 text-[#6F63E8]">단어 {items.reduce((sum, item) => sum + item.wordQuiz, 0)}</span>
            <span className="rounded-xl bg-[#FFF1EA] px-2 py-2 text-[#E8664F]">문장 {items.reduce((sum, item) => sum + item.sentenceQuiz, 0)}</span>
          </div>
        </>
      )}

      {tab === 'xp' && (
        <>
          <div className="rounded-[1.5rem] bg-[#FBFCFD] px-3 py-4">
            <SimpleBars items={items} valueKey="xp" color="#FF9B73" max={maxXp} />
          </div>
          <div className="mt-3 rounded-xl bg-[#FFF1EA] px-3 py-2 text-xs font-normal text-[#E8664F]">
            최근 14일 {totals.xp} XP
          </div>
        </>
      )}

      {tab === 'words' && (
        <>
          <div className="rounded-[1.5rem] bg-[#FBFCFD] px-3 py-4">
            <DoubleBars items={items} max={maxWords} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-normal text-center">
            <span className="rounded-xl bg-[#E8FAF7] px-2 py-2 text-[#00A994]">한자 {totals.hanja}</span>
            <span className="rounded-xl bg-[#F0EFFF] px-2 py-2 text-[#6F63E8]">단어 {totals.words}</span>
          </div>
        </>
      )}

      {tab === 'wrong' && (
        <>
          <div className="rounded-[1.5rem] bg-[#FBFCFD] px-3 py-4">
            <SimpleBars items={items} valueKey="wrong" color="#FF6B6B" max={maxWrong} />
          </div>
          <div className="mt-3 rounded-xl bg-[#FFF1EE] px-3 py-2 text-xs font-normal text-[#C94C3B]">
            최근 14일 오답 단어 {totals.wrong}개
          </div>
        </>
      )}
    </section>
  );
};

const StudyHistoryScreen = ({ onBack, isDarkMode }) => {
  const studyLog = useMemo(() => readStudyLog(), []);
  const missionHistory = useMemo(() => readMissionHistory(), []);
  const streakCount = useMemo(() => readStreak(), []);
  const days = studyLog.days || {};
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(todayStr);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const getDayStr = (day) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getDayState = (day) => {
    const ds = getDayStr(day);
    const entry = days[ds] || {};
    const missions = missionHistory[ds] || [];
    const summary = getEntrySummary(entry, missions);
    const isToday = ds === todayStr;
    const isPast = new Date(year, month, day) < new Date(new Date().setHours(0, 0, 0, 0));

    if (isToday) return 'today';
    if (summary.totalCount > 0 || summary.activities.length > 0) return 'done';
    if (isPast) return 'miss';
    return 'future';
  };

  const selectedEntry = days[selectedDay] || {};
  const selectedSummary = getEntrySummary(selectedEntry, missionHistory[selectedDay] || []);
  const hasSelectedData = selectedSummary.totalCount > 0 || selectedSummary.activities.length > 0;

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-[#F7FAF9] text-[#334155]'}`}>
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-5 px-5 pt-4 safe-top safe-bottom">
        <header className={`flex min-h-[64px] items-center justify-between rounded-[2rem] border px-4 shadow-sm ${isDarkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-white'}`}>
          <button
            onClick={onBack}
            className={`h-10 w-10 rounded-2xl border font-normal shadow-sm active:scale-95 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-100 text-[#5B677A]'}`}
          >
            ←
          </button>
          <div className="text-center">
            <h2 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>날짜별 현황</h2>
            <p className={`text-[11px] font-normal ${isDarkMode ? 'text-slate-400' : 'text-[#8D9CAE]'}`}>
              하루 기록을 한눈에 확인해요
            </p>
          </div>
          <div className="h-10 w-10" />
        </header>

        <StudyGraph days={days} isDarkMode={isDarkMode} />

        <section className={`rounded-[2rem] border p-5 shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-white'}`}>
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className={`h-10 w-10 rounded-2xl border font-normal ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-[#F4F6F8] border-slate-100'}`}
            >
              ‹
            </button>
            <div className="text-center">
              <p className="text-[11px] font-normal tracking-[0.2em] text-[#8D9CAE]">{year}</p>
              <p className="text-xl font-normal text-[#00A994]">{month + 1}월</p>
            </div>
            <button
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className={`h-10 w-10 rounded-2xl border font-normal ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-[#F4F6F8] border-slate-100'}`}
            >
              ›
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 text-center text-xs font-normal text-[#8D9CAE]">
            {['일', '월', '화', '수', '목', '금', '토'].map(day => <span key={day}>{day}</span>)}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {cells.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;
              const ds = getDayStr(day);
              const state = getDayState(day);
              const isSelected = selectedDay === ds;
              const base = 'aspect-square rounded-2xl text-xs font-normal transition-all active:scale-95';
              const classes = {
                today: 'bg-[#00C7AE] text-white shadow-md shadow-teal-500/25',
                done: 'bg-white text-[#334155] border-2 border-[#00C7AE]/45',
                miss: 'bg-[#F0F2F5] text-[#B8C0CC]',
                future: 'bg-transparent text-[#C5CAD4]',
              };

              return (
                <button
                  key={ds}
                  onClick={() => setSelectedDay(ds)}
                  className={`${base} ${classes[state]} ${isSelected ? 'ring-4 ring-[#00C7AE]/20 scale-105' : ''}`}
                >
                  {state === 'today' ? <span className="block text-[9px] leading-none">오늘</span> : null}
                  <span className="leading-none">{day}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 rounded-2xl bg-[#F8FAF9] py-2 text-[11px] font-normal text-[#5D677A]">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border-2 border-[#00C7AE]" />학습 완료</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#00C7AE]" />오늘</span>
            {streakCount > 0 ? <span className="text-[#FF8D7E]">{streakCount}일 연속</span> : null}
          </div>
        </section>

        <section className={`rounded-[2rem] border p-5 shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-white'}`}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-normal tracking-wider text-[#8D9CAE]">{selectedDay.replace(/-/g, '.')}</p>
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-[#334155]'}`}>학습 내용</h3>
            </div>
            <span className="rounded-full bg-[#F4F6F8] px-3 py-1 text-xs font-normal text-[#5D677A]">
              {selectedSummary.activities.length}개 활동
            </span>
          </div>

          {!hasSelectedData ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 py-10 text-center text-sm font-normal text-[#AEB7C5]">
              이 날은 학습 기록이 없어요
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {selectedSummary.activities.length > 0 && (
                <DetailSection title="완료한 활동" count={selectedSummary.activities.length} tone="teal">
                  <div className="grid grid-cols-2 gap-2">
                    {selectedSummary.activities.map(type => (
                      <div key={type} className="rounded-2xl bg-[#F8FAF9] px-3 py-2 text-sm font-normal text-[#45546A]">
                        {activityLabels[type] || type}
                      </div>
                    ))}
                  </div>
                </DetailSection>
              )}

              {selectedSummary.hanjas.length > 0 && (
                <DetailSection title="학습한 한자" count={selectedSummary.hanjas.length} tone="slate">
                  <div className="grid grid-cols-2 gap-2">
                    {selectedSummary.hanjas.map(h => (
                      <div key={h.id} className="rounded-2xl border border-slate-100 bg-white px-3 py-2 shadow-sm">
                        <span className="mr-2 text-lg font-normal text-[#334155]">{h.hanja}</span>
                        <span className="text-xs font-normal text-[#94A3B8]">{h.sound} · {h.meaning}</span>
                      </div>
                    ))}
                  </div>
                </DetailSection>
              )}

              {selectedSummary.correctWords.length > 0 && (
                <DetailSection title="맞춘 단어" count={selectedSummary.correctWords.length} tone="teal">
                  <div className="flex flex-col gap-2">
                    {selectedSummary.correctWords.map(w => (
                      <div key={w.id} className="flex items-center justify-between rounded-2xl bg-[#F8FAF9] px-3 py-2">
                        <span className="font-normal text-[#334155]">{w.word}</span>
                        <span className="text-xs font-normal text-[#94A3B8]">{w.reading}</span>
                      </div>
                    ))}
                  </div>
                </DetailSection>
              )}

              {selectedSummary.wrongWords.length > 0 && (
                <DetailSection title="틀린 단어" count={selectedSummary.wrongWords.length} tone="coral">
                  <div className="flex flex-col gap-2">
                    {selectedSummary.wrongWords.map(w => (
                      <div key={w.id} className="flex items-center justify-between rounded-2xl bg-[#FFF1EE] px-3 py-2">
                        <span className="font-normal text-[#C94C3B]">{w.word}</span>
                        <span className="text-xs font-normal text-[#E8664F]">{w.reading}</span>
                      </div>
                    ))}
                  </div>
                </DetailSection>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default StudyHistoryScreen;
