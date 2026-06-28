const fs = require('fs');
const path = require('path');
const {
  TARGET_LANGS,
  collectReferencedKeys,
  findJunkEntries,
  findMissingKeys,
  findPlaceholderMismatches,
  getPlaceholders,
  getExtractedFile,
  i18nDir,
  readJson,
  srcRoot,
} = require('./i18n_utils.js');

const BAD_SOURCE_KEY_SEQUENCES = [
  {
    name: 'grade-dashboard-title-jamo',
    pattern: /ext_34.*ext_69.*ext_191.*ext_143/,
  },
  {
    name: 'locked-grade-label-split',
    pattern: /ext_41.*ext_56/,
  },
  {
    name: 'journey-monster-hint-split',
    pattern: /ext_178.*ext_125/,
  },
  {
    name: 'combo-correct-label-split',
    pattern: /ext_71.*ext_275/,
  },
];

function walkCodeFiles(dir = srcRoot, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkCodeFiles(fullPath, files);
    } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function findBadSourceKeySequences() {
  const projectRoot = path.resolve(__dirname, '..');
  const entries = [];

  for (const file of walkCodeFiles()) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const rule of BAD_SOURCE_KEY_SEQUENCES) {
        if (rule.pattern.test(line)) {
          entries.push({
            rule: rule.name,
            file: path.relative(projectRoot, file),
            line: index + 1,
            value: line.trim().slice(0, 180),
          });
        }
      }
    });
  }

  return entries;
}

function findMissingPlaceholderParams(sourceData) {
  const placeholderKeys = new Map(
    Object.entries(sourceData)
      .map(([key, value]) => [key, getPlaceholders(value)])
      .filter(([, placeholders]) => placeholders.length > 0)
  );
  const entries = [];
  const projectRoot = path.resolve(__dirname, '..');
  const noParamCalls = [
    /\bt\(\s*['"](ext_\d+)['"]\s*\)/g,
    /\btOrFallback\(\s*t\s*,\s*['"](ext_\d+)['"]\s*\)/g,
  ];

  for (const file of walkCodeFiles()) {
    const content = fs.readFileSync(file, 'utf8');
    for (const pattern of noParamCalls) {
      for (const match of content.matchAll(pattern)) {
        const key = match[1];
        const placeholders = placeholderKeys.get(key);
        if (!placeholders) continue;
        entries.push({
          file: path.relative(projectRoot, file),
          key,
          placeholders,
        });
      }
    }
  }

  return entries;
}

function findFilteredKoreanJunk() {
  const filePath = path.join(i18nDir, 'filtered_ko.json');
  const data = readJson(filePath);
  if (!data) return [];
  return findJunkEntries(data, Object.keys(data));
}

function listExistingLanguageFiles() {
  return ['ko', 'en', ...TARGET_LANGS.map((lang) => lang.code)]
    .filter((code, index, arr) => arr.indexOf(code) === index)
    .filter((code) => fs.existsSync(getExtractedFile(code)));
}

function main() {
  const referencedKeys = collectReferencedKeys();
  const ko = readJson(getExtractedFile('ko'));

  if (!ko) {
    console.error('Missing source file: frontend/src/i18n/extracted_ko.json');
    process.exit(1);
  }

  const sourceMissing = findMissingKeys(ko, referencedKeys);
  const sourceJunk = findJunkEntries(ko, Object.keys(ko));
  const badSourceKeySequences = findBadSourceKeySequences();
  const missingPlaceholderParams = findMissingPlaceholderParams(ko);
  const filteredKoreanJunk = findFilteredKoreanJunk();
  const failures = [];

  if (sourceMissing.length > 0) {
    failures.push({
      type: 'missing-source-keys',
      lang: 'ko',
      count: sourceMissing.length,
      keys: sourceMissing.slice(0, 30),
    });
  }

  if (sourceJunk.length > 0) {
    failures.push({
      type: 'source-code-like-junk',
      lang: 'ko',
      count: sourceJunk.length,
      entries: sourceJunk.slice(0, 30),
    });
  }

  if (badSourceKeySequences.length > 0) {
    failures.push({
      type: 'bad-source-key-sequence',
      count: badSourceKeySequences.length,
      entries: badSourceKeySequences.slice(0, 30),
    });
  }

  if (missingPlaceholderParams.length > 0) {
    failures.push({
      type: 'missing-placeholder-params',
      count: missingPlaceholderParams.length,
      entries: missingPlaceholderParams.slice(0, 30),
    });
  }

  if (filteredKoreanJunk.length > 0) {
    failures.push({
      type: 'filtered-ko-code-like-junk',
      lang: 'ko',
      count: filteredKoreanJunk.length,
      entries: filteredKoreanJunk.slice(0, 30),
    });
  }

  for (const code of listExistingLanguageFiles()) {
    const filePath = getExtractedFile(code);
    const data = readJson(filePath);
    const missing = findMissingKeys(data, referencedKeys);
    const junk = findJunkEntries(data, Object.keys(data));
    const placeholderMismatches = code === 'ko'
      ? []
      : findPlaceholderMismatches(ko, data, referencedKeys);

    if (missing.length > 0) {
      failures.push({
        type: 'missing-translated-keys',
        lang: code,
        count: missing.length,
        keys: missing.slice(0, 30),
      });
    }

    if (junk.length > 0) {
      failures.push({
        type: 'translated-code-like-junk',
        lang: code,
        count: junk.length,
        entries: junk.slice(0, 30),
      });
    }

    if (placeholderMismatches.length > 0) {
      failures.push({
        type: 'placeholder-mismatch',
        lang: code,
        count: placeholderMismatches.length,
        entries: placeholderMismatches.slice(0, 30),
      });
    }
  }

  if (failures.length > 0) {
    console.error('i18n check failed:');
    console.error(JSON.stringify(failures, null, 2));
    process.exit(1);
  }

  const langs = listExistingLanguageFiles().join(', ');
  console.log(`i18n check passed (${referencedKeys.length} referenced keys, checked: ${langs}).`);
}

main();
