/**
 * Utility for ensuring Sets of IDs are strictly numeric.
 * This prevents bugs where Set.has() fails due to strict equality (===)
 * when IDs from external storage (strings) are compared with internal IDs (numbers).
 *
 * @param {Array<number|string>} arr - Array of IDs (strings or numbers)
 * @returns {Set<number>} - A Set containing strictly numeric IDs
 */
export const toIdSet = (arr) => {
    if (!arr) return new Set();
    if (arr instanceof Set) return arr;
    if (!Array.isArray(arr)) return new Set();
    return new Set(
        arr.map(Number).filter(n => !Number.isNaN(n))
    );
};
