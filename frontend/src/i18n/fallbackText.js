import enExtracted from './extracted_en.json';

const interpolate = (value, params) => {
  if (!params || typeof value !== 'string') return value;
  return value.replace(/\{([^}]+)\}/g, (_, key) => params[key] ?? `{${key}}`);
};

export const fallbackT = (key, params) => interpolate(enExtracted[key] ?? key, params);

export const tOrFallback = (t, key, params) =>
  typeof t === 'function' ? t(key, params) : fallbackT(key, params);
