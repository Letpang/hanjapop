// unlockedPack: 0=free, 1=pack1(18~51), 2=pack2(52~124), 3=fullpack(1~124)
export const canAccessStage = (pack, stage) => {
    if (stage <= 17) return true;
    if (stage <= 51) return pack === 1 || pack === 3;
    return pack === 2 || pack === 3;
};
