import HANJA_DATA from '../hanja_unified.json';

// word id → word 객체 (hanjaId, hanja 포함)
export const wordById = {};
// word 문자열 → word id (마이그레이션용)
export const wordByString = {};

HANJA_DATA.forEach(h => {
    (h.words || []).forEach(w => {
        wordById[w.id] = { ...w, hanjaId: h.id, hanja: h.hanja };
        wordByString[w.word] = w.id;
    });
});
