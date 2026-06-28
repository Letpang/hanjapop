export const TOTAL_STAGES = 124;

export const GRADES = [
    { label: '8급', firstStage: 1, color: '#2ED6C5' },
    { label: '7급Ⅱ', firstStage: 18, color: '#7C83FF' },
    { label: '7급', firstStage: 36, color: '#9B6BFF' },
    { label: '6급Ⅱ', firstStage: 54, color: '#FF9B73' },
    { label: '6급', firstStage: 89, color: '#FF6B6B' },
];

export const FLOAT_CSS = `
@keyframes mm-float {
    0%   { transform: translateY(0px); }
    50%  { transform: translateY(-8px); }
    100% { transform: translateY(0px); }
}
@keyframes mm-float-fast {
    0%   { transform: translateY(0px); }
    50%  { transform: translateY(-6px); }
    100% { transform: translateY(0px); }
}
@keyframes mm-sparkle {
    0%, 100% { opacity: 0.45; transform: scale(0.9) rotate(0deg); }
    50%      { opacity: 1; transform: scale(1.1) rotate(8deg); }
}
@keyframes mm-cta-shine {
    0%   { transform: translateX(-130%) skewX(-14deg); opacity: 0; }
    18%  { opacity: 0.75; }
    42%  { opacity: 0.25; }
    100% { transform: translateX(170%) skewX(-14deg); opacity: 0; }
}
`;

export const MISSION_META = {
    flashcard: { label: 'ext_1596', icon: '/assets/images/icons/study.webp', nav: 'flashcard', color: '#FF9B73' },
    wordQuiz: { label: 'ext_1492', icon: '/assets/images/icons/words.webp', nav: 'wordQuiz', color: '#7C83FF' },
    sentenceQuiz: { label: 'ext_1493', icon: '/assets/images/icons/sentence.webp', nav: 'sentenceQuiz', color: '#7C83FF' },
    shootGame: { label: 'ext_1573', icon: '/assets/images/icons/monster.webp', nav: 'shootGame', color: '#2ED6C5' },
    matchGame: { label: 'ext_1574', icon: '/assets/images/icons/matching.webp', nav: 'matchGame', color: '#2ED6C5' },
    writing: { label: 'ext_1496', icon: '/assets/images/icons/writing.webp', nav: 'writing', color: '#FFB347' },
    idiomQuiz: { label: 'ext_1391', icon: null, nav: 'idiomQuiz', color: '#9B6BFF' },
};
