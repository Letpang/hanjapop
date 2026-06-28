export const GRADES = ['전체', '8급', '7급Ⅱ', '7급', '6급Ⅱ', '6급'];

const CATEGORY_KEY_MAP = {
    '숫자와 기초 개념': 'ext_1693',
    '자연과 시간': 'ext_1559',
    '나와 가족 신체': 'ext_1656',
    '공간과 위치': 'ext_1560',
    '학교와 일상생활': 'ext_1657',
    '행동과 상태': 'ext_1561',
    '사회와 문화': 'ext_1562',
};
export const categoryLabel = (category, t) => t(CATEGORY_KEY_MAP[category] || category);

export const CATEGORY_IMAGES = {
    '숫자와 기초 개념': '1_一.webp',
    '자연과 시간': '31_日.webp',
    '나와 가족 신체': '71_父.webp',
    '공간과 위치': '111_東.webp',
    '학교와 일상생활': '151_學.webp',
    '행동과 상태': '201_來.webp',
    '사회와 문화': '251_國.webp',
};
