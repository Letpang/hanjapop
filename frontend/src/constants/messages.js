export const CLEAR_MESSAGES = [
    '와우! 참 잘했어요!',
    '최고예요! 대단해요!',
    '훌륭해요! 빛났어요!',
    '멋져요! 실력이 쑥쑥!',
    '완벽한 실력이에요!',
    '굉장해요! 역시 달라요!',
    '짱이에요! 수고했어요!',
    '대단해요! 탐험 완료!',
    '브라보! 해냈어요!',
    '꾸준함이 최고예요!',
];

export const pickClearMessage = () =>
    CLEAR_MESSAGES[Math.floor(Math.random() * CLEAR_MESSAGES.length)];
