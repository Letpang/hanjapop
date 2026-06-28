import HANJA_DATA from '../../../hanja_unified.json';

export const WRITING_CATEGORIES = [
  ...new Set((HANJA_DATA || []).map(hanja => hanja.category).filter(Boolean)),
];
