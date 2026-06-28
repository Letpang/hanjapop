export const hasPassedQuizMission = (correct, total) =>
    Number(total) > 0 && Number(correct) / Number(total) >= 0.7;

export const GRADE_TEST_SCREENS = ['gradeTest', 'gradeTest72', 'gradeTest7', 'gradeTest62', 'gradeTest6'];

export const GRADE_HIERARCHY = ['8급', '7급II', '7급', '6급II', '6급'];

export const LEGACY_STORAGE_KEYS = [
    'hanja_active_planet',
    'hanja_dark_mode',
    'hanja_last_planet',
    'hanja_stages_save',
    'hanja_stickers_save',
    'hanja_writing_paths',
    'hanja_xp_save',
    'intro_hook_done',
    'main_seen_hanja',
    'unlocked_characters',
    'journey_state',
    'unlocked_stickers',
    'mastery_data',
    'srs_data',
    'word_wrong_data',
    'today_stats',
    'total_activity_stats',
    'daily_study_log',
    'main_seen_words',
];

export const RANK_SOON_KEY = 'rank_soon_last_shown';

export const isInRankSoonZone = (level) => [3, 4, 7, 8, 11, 12, 15, 16].includes(level);

export const getMockTestScreenId = (grade) => {
    if (grade === '8급') return 'gradeTest';
    if (grade === '7급Ⅱ' || grade === '7급II') return 'gradeTest72';
    if (grade === '7급') return 'gradeTest7';
    if (grade === '6급Ⅱ' || grade === '6급II') return 'gradeTest62';
    if (grade === '6급') return 'gradeTest6';
    return 'gradeTest';
};
