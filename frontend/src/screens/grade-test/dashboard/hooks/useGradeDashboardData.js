import { useMemo } from 'react';
import HANJA_DATA from '../../../../hanja_unified.json';
import { toIdSet } from '../../../../utils/setIdUtils.js';
import IDIOMS from '../../../../data/idioms.js';
import { localizeIdioms } from '../../../../data/idiomI18nKeys.js';
import { SK } from '../../../../constants/storageKeys.js';
import { useLang } from '../../../../hooks/useLang.js';
import { canAccessGrade } from '../../../../utils/premiumAccess.js';
import { GRADE_ORDER, getGradeTheme, normalizeGrade } from '../gradeDashboardData.js';

const getMockPassed = (normalizedGrade) => {
  try {
    const saved = localStorage.getItem(SK.UNLOCKED_GRADE);
    if (!saved) return false;
    return GRADE_ORDER.indexOf(normalizeGrade(saved)) >= GRADE_ORDER.indexOf(normalizedGrade);
  } catch {
    return false;
  }
};

const getGradeWords = (hanjaList) => (
  hanjaList.flatMap((hanjaItem) => (
    (hanjaItem.words || [])
      .filter((word) => word.type !== 'idiom')
      .map((word) => ({ ...word, hanjaChar: hanjaItem.hanja }))
  ))
);

const getGradeIdioms = (hanjaList, idiomSource) => {
  const seen = new Set();
  return hanjaList
    .flatMap((hanjaItem) => (hanjaItem.words || []).filter((word) => word.type === 'idiom'))
    .filter((word) => {
      if (seen.has(word.word)) return false;
      seen.add(word.word);
      return true;
    })
    .map((word) => {
      const meta = idiomSource.find((idiom) => idiom.hanja === word.word);
      return meta ? { ...word, ...meta } : word;
    });
};

const filterVocabulary = (items, wordSearch) => {
  const query = wordSearch.trim().toLowerCase();
  if (!query) return items;

  return items.filter((item) => (
    [item.word, item.hanja, item.reading, item.meaning]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  ));
};

export const useGradeDashboardData = ({
  grade,
  unlockedPack,
  clearedHanjaIds,
  wordTab,
  wordSearch,
}) => {
  const { t } = useLang();
  const normalizedGrade = normalizeGrade(grade);
  const theme = getGradeTheme(normalizedGrade);
  const isUnlocked = canAccessGrade(unlockedPack, normalizedGrade);

  const hanjaList = useMemo(() => (
    HANJA_DATA.filter((hanjaItem) => hanjaItem.grade && normalizeGrade(hanjaItem.grade) === normalizedGrade)
  ), [normalizedGrade]);

  const clearedIdsSet = useMemo(() => toIdSet(clearedHanjaIds), [clearedHanjaIds]);
  const clearedCount = useMemo(() => (
    hanjaList.filter((hanjaItem) => clearedIdsSet.has(hanjaItem.id)).length
  ), [hanjaList, clearedIdsSet]);

  const progressPct = hanjaList.length > 0
    ? Math.round((clearedCount / hanjaList.length) * 100)
    : 0;

  const mockPassed = useMemo(() => getMockPassed(normalizedGrade), [normalizedGrade]);
  const gradeWords = useMemo(() => getGradeWords(hanjaList), [hanjaList]);
  const localizedIdioms = useMemo(() => localizeIdioms(IDIOMS, t), [t]);
  const gradeIdioms = useMemo(() => getGradeIdioms(hanjaList, localizedIdioms), [hanjaList, localizedIdioms]);
  const gradeSentenceCount = useMemo(() => (
    gradeWords.filter((word) => typeof word.example === 'string' && word.example.trim().length > 0).length
  ), [gradeWords]);

  const activeVocabulary = wordTab === 'words' ? gradeWords : gradeIdioms;
  const filteredVocabulary = useMemo(() => (
    filterVocabulary(activeVocabulary, wordSearch)
  ), [activeVocabulary, wordSearch]);

  return {
    normalizedGrade,
    theme,
    isUnlocked,
    hanjaList,
    clearedCount,
    progressPct,
    mockPassed,
    gradeWords,
    gradeIdioms,
    gradeSentenceCount,
    filteredVocabulary,
  };
};
