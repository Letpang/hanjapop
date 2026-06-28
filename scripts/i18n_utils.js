const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const frontendRoot = path.join(projectRoot, 'frontend');
const srcRoot = path.join(frontendRoot, 'src');
const i18nDir = path.join(srcRoot, 'i18n');

const TARGET_LANGS = [
  { code: 'ja', name: 'Japanese' },
  { code: 'zh-CN', name: 'Simplified Chinese' },
  { code: 'zh-TW', name: 'Traditional Chinese' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'it', name: 'Italian' },
  { code: 'tr', name: 'Turkish' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ms', name: 'Malay' },
  { code: 'pl', name: 'Polish' },
  { code: 'nl', name: 'Dutch' },
];

const SOURCE_EXT = /\.(jsx?|tsx?|json)$/;
const BAD_TEXT = /(^[\s}>/]+|\}\}\>|\{m\.xp\}|className=|on[A-Z][A-Za-z0-9]*=|<\/?[A-Za-z][^>]*>|=>|\{[^}]*[+\-*/][^}]*\}|\b(const|function|export|import)\s+|\.filter\(|\.map\(|localStorage|useCallback|useEffect|\$\{)/;
const PLACEHOLDER_RE = /\{([A-Za-z0-9_.]+)\}/g;

function getExtractedFile(langCode) {
  return path.join(i18nDir, `extracted_${langCode}.json`);
}

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function normalizeI18nValue(value) {
  return typeof value === 'string'
    ? value.replace(/^[\s}>/]+/, '').trim()
    : value;
}

function sortExtKeys(keys) {
  return [...keys].sort((a, b) => Number(a.slice(4)) - Number(b.slice(4)));
}

function walkSource(dir = srcRoot, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkSource(fullPath, files);
    } else if (
      SOURCE_EXT.test(entry.name)
      && !fullPath.includes(`${path.sep}i18n${path.sep}extracted_`)
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

function collectReferencedKeys() {
  const keys = new Set();
  for (const file of walkSource()) {
    const content = fs.readFileSync(file, 'utf8');
    for (const match of content.matchAll(/ext_\d+/g)) {
      keys.add(match[0]);
    }
  }
  return sortExtKeys(keys);
}

function pickKeys(data, keys) {
  const picked = {};
  for (const key of keys) {
    if (Object.hasOwn(data, key)) picked[key] = data[key];
  }
  return picked;
}

function getPlaceholders(value) {
  const placeholders = new Set();
  const str = String(value ?? '');
  for (const match of str.matchAll(PLACEHOLDER_RE)) {
    placeholders.add(match[1]);
  }
  return sortExtKeysLike([...placeholders]);
}

function sortExtKeysLike(values) {
  return values.sort((a, b) => a.localeCompare(b));
}

function sameStringArray(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function findJunkEntries(data, keys) {
  return keys
    .filter((key) => BAD_TEXT.test(String(data[key] || '')))
    .map((key) => ({
      key,
      value: String(data[key] || '').slice(0, 180).replace(/\n/g, '\\n'),
    }));
}

function findMissingKeys(data, keys) {
  return keys.filter((key) => !Object.hasOwn(data, key));
}

function findPlaceholderMismatches(sourceData, targetData, keys) {
  return keys
    .map((key) => {
      const source = getPlaceholders(sourceData[key]);
      const target = getPlaceholders(targetData[key]);
      return sameStringArray(source, target) ? null : { key, source, target };
    })
    .filter(Boolean);
}

module.exports = {
  BAD_TEXT,
  TARGET_LANGS,
  collectReferencedKeys,
  findJunkEntries,
  findMissingKeys,
  findPlaceholderMismatches,
  frontendRoot,
  getExtractedFile,
  getPlaceholders,
  i18nDir,
  normalizeI18nValue,
  pickKeys,
  readJson,
  sortExtKeys,
  srcRoot,
  writeJson,
};
