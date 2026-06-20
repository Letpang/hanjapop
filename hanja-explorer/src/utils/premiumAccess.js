// unlockedPack: 0=free, 1=pack1(18~51), 2=pack2(52~124), 3=fullpack(1~124)
export const canAccessStage = (pack, stage) => {
    if (stage <= 17) return true;
    if (stage <= 51) return pack === 1 || pack === 3;
    return pack === 2 || pack === 3;
};

export const canAccessGrade = (pack, grade) => {
    if (grade === '8급') return true;
    if (grade === '7급Ⅱ' || grade === '7급' || grade === '7급II') return pack === 1 || pack === 3;
    if (grade === '6급Ⅱ' || grade === '6급' || grade === '6급II') return pack === 2 || pack === 3;
    return false;
};
