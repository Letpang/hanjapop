import { useMemo, useState } from 'react';
import StudyCalendar from './history/components/StudyCalendar.jsx';
import StudyDayDetails from './history/components/StudyDayDetails.jsx';
import StudyGraph from './history/components/StudyGraph.jsx';
import {
  getEntrySummary,
  readMissionHistory,
  readStreak,
  readStudyLog,
  todayStr,
} from './history/historyUtils.js';
import { useLang } from '../../hooks/useLang.js';

const StudyHistoryScreen = ({ onBack }) => {
  const { t } = useLang();
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

  const selectedEntry = days[selectedDay] || {};
  const selectedSummary = getEntrySummary(selectedEntry, missionHistory[selectedDay] || []);
  const hasSelectedData = selectedSummary.totalCount > 0 || selectedSummary.activities.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="safe-top safe-bottom mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 px-5 pt-4">
        <header className="flex min-h-[64px] items-center justify-between rounded-[2rem] border px-4 shadow-sm bg-[var(--color-bg-surface)] border-[var(--color-border-subtle)]">
          <button
            onClick={onBack}
            className="h-10 w-10 rounded-2xl border font-normal shadow-sm active:scale-95 bg-white border-slate-100 text-[color:var(--color-text-muted)] dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          >
            ←
          </button>
          <div className="text-center">
            <h2 className="text-lg font-medium text-slate-700 dark:text-white">{t('ext_1645')}</h2>
            <p className="text-base font-normal text-[#8D9CAE] dark:text-slate-400">
              {t('ext_2664')}
            </p>
          </div>
          <div className="h-10 w-10" />
        </header>

        <StudyGraph days={days} />

        <StudyCalendar
          cells={cells}
          days={days}
          missionHistory={missionHistory}
          month={month}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          setViewDate={setViewDate}
          streakCount={streakCount}
          year={year}
        />

        <StudyDayDetails
          hasSelectedData={hasSelectedData}
          selectedDay={selectedDay}
          selectedSummary={selectedSummary}
        />
      </div>
    </div>
  );
};

export default StudyHistoryScreen;