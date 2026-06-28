const fs = require('fs');
const path = require('path');
const {
  TARGET_LANGS,
  collectReferencedKeys,
  findJunkEntries,
  findMissingKeys,
  findPlaceholderMismatches,
  getExtractedFile,
  getPlaceholders,
  pickKeys,
  readJson,
  writeJson,
} = require('./i18n_utils.js');

const ENV_PATH = path.join(__dirname, '../frontend/.env');
const CHUNK_SIZE = 40;
const MODEL = process.env.OPENAI_TRANSLATION_MODEL || 'gpt-4o-mini';
const EXTRA_LANGS = [{ code: 'en', name: 'English' }];

function getOpenAIKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY.trim();
  if (!fs.existsSync(ENV_PATH)) return null;

  const envContent = fs.readFileSync(ENV_PATH, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const [key, ...rest] = line.split('=');
    if (key.trim() === 'OPENAI_API_KEY') {
      return rest.join('=').trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return null;
}

const API_KEY = getOpenAIKey();

function parseArgs() {
  const args = process.argv.slice(2);
  const langArg = args.find((arg) => arg.startsWith('--lang='));
  const selectedLang = langArg ? langArg.slice('--lang='.length) : null;
  const force = args.includes('--force');
  return { selectedLang, force };
}

function chunkKeys(keys, size) {
  const chunks = [];
  for (let i = 0; i < keys.length; i += size) {
    chunks.push(keys.slice(i, i + size));
  }
  return chunks;
}

function objectForKeys(data, keys) {
  const out = {};
  for (const key of keys) out[key] = data[key];
  return out;
}

function stringifyPlaceholders(data, keys) {
  const lines = [];
  for (const key of keys) {
    const placeholders = getPlaceholders(data[key]);
    lines.push(`${key}: ${placeholders.length ? placeholders.map((p) => `{${p}}`).join(', ') : 'none'}`);
  }
  return lines.join('\n');
}

function assertChunkTranslation({ sourceChunk, translatedChunk, langCode }) {
  const keys = Object.keys(sourceChunk);
  const missing = findMissingKeys(translatedChunk, keys);
  const extra = Object.keys(translatedChunk).filter((key) => !Object.hasOwn(sourceChunk, key));
  const junk = findJunkEntries(translatedChunk, keys);
  const placeholderMismatches = findPlaceholderMismatches(sourceChunk, translatedChunk, keys);

  if (missing.length || extra.length || junk.length || placeholderMismatches.length) {
    const details = { langCode, missing, extra, junk, placeholderMismatches };
    throw new Error(`Invalid translation chunk: ${JSON.stringify(details).slice(0, 3000)}`);
  }
}

async function translateChunk(sourceChunk, lang, retryCount = 0) {
  const keys = Object.keys(sourceChunk);
  const prompt = `Translate ONLY the JSON values from Korean to ${lang.name}.
This is for HanjaPop, a friendly educational mobile app for learners.

Rules:
- Return ONLY a valid JSON object.
- Keep every JSON key exactly unchanged.
- Keep placeholder tokens exactly unchanged, including braces. Examples: {n}, {price}, {nickname}.
- If a key says "none" in the placeholder list, the translated value MUST NOT contain any curly-brace placeholders.
- Do not add keys. Do not remove keys.
- Do not translate Hanja characters themselves.
- Keep product/app names such as HanjaPop unchanged unless a natural transliteration is absolutely necessary.
- Make the tone natural, concise, friendly, and suitable for a learning app.

Placeholders in this chunk:
${stringifyPlaceholders(sourceChunk, keys)}

Input JSON:
${JSON.stringify(sourceChunk, null, 2)}
`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.15,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429 && retryCount < 8) {
        const delayMs = Math.min(45000, 5000 * (retryCount + 1));
        console.log(`[${lang.code}] rate limited. retrying in ${delayMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return translateChunk(sourceChunk, lang, retryCount + 1);
      }
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const translatedChunk = JSON.parse(content);
    assertChunkTranslation({ sourceChunk, translatedChunk, langCode: lang.code });
    return translatedChunk;
  } catch (error) {
    if (retryCount < 3) {
      console.log(`[${lang.code}] chunk failed. retrying... ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return translateChunk(sourceChunk, lang, retryCount + 1);
    }
    throw error;
  }
}

function getInvalidExistingKeys(sourceData, targetData, referencedKeys) {
  const missing = findMissingKeys(targetData, referencedKeys);
  const junk = findJunkEntries(targetData, referencedKeys).map((entry) => entry.key);
  const placeholderMismatches = findPlaceholderMismatches(sourceData, targetData, referencedKeys)
    .map((entry) => entry.key);
  return [...new Set([...missing, ...junk, ...placeholderMismatches])];
}

function writeOrderedTarget(outFile, targetData, referencedKeys) {
  writeJson(outFile, pickKeys(targetData, referencedKeys));
}

async function translateLanguage({ lang, sourceData, referencedKeys, force }) {
  const outFile = getExtractedFile(lang.code);
  const existing = readJson(outFile, {});
  const targetData = force ? {} : pickKeys(existing, referencedKeys);
  const invalidKeys = force ? referencedKeys : getInvalidExistingKeys(sourceData, targetData, referencedKeys);

  for (const key of invalidKeys) {
    delete targetData[key];
  }

  const missingKeys = referencedKeys.filter((key) => !Object.hasOwn(targetData, key));

  if (missingKeys.length === 0) {
    writeOrderedTarget(outFile, targetData, referencedKeys);
    console.log(`[${lang.code}] already complete (${referencedKeys.length} keys).`);
    return;
  }

  const chunks = chunkKeys(missingKeys, CHUNK_SIZE);
  console.log(`[${lang.code}] translating ${missingKeys.length}/${referencedKeys.length} keys in ${chunks.length} chunks.`);

  for (let i = 0; i < chunks.length; i += 1) {
    const chunkKeysForCall = chunks[i];
    const sourceChunk = objectForKeys(sourceData, chunkKeysForCall);
    console.log(`[${lang.code}] chunk ${i + 1}/${chunks.length}`);
    const translatedChunk = await translateChunk(sourceChunk, lang);
    Object.assign(targetData, translatedChunk);
    writeOrderedTarget(outFile, targetData, referencedKeys);
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  console.log(`[${lang.code}] complete: ${outFile}`);
}

async function main() {
  if (!API_KEY) {
    console.error('OPENAI_API_KEY is missing. Put it in environment variables or frontend/.env.');
    process.exit(1);
  }

  const { selectedLang, force } = parseArgs();
  const selectableLangs = [...EXTRA_LANGS, ...TARGET_LANGS];
  const langs = selectedLang
    ? selectableLangs.filter((lang) => lang.code === selectedLang)
    : TARGET_LANGS;

  if (selectedLang && langs.length === 0) {
    console.error(`Unknown language code: ${selectedLang}`);
    process.exit(1);
  }

  const koData = readJson(getExtractedFile('ko'));
  if (!koData) {
    console.error('Missing source file: frontend/src/i18n/extracted_ko.json');
    process.exit(1);
  }

  const referencedKeys = collectReferencedKeys();
  const sourceData = pickKeys(koData, referencedKeys);
  const missingSource = findMissingKeys(sourceData, referencedKeys);
  const sourceJunk = findJunkEntries(sourceData, referencedKeys);

  if (missingSource.length || sourceJunk.length) {
    console.error('Korean source i18n data is not safe to translate.');
    console.error(JSON.stringify({ missingSource, sourceJunk: sourceJunk.slice(0, 30) }, null, 2));
    process.exit(1);
  }

  console.log(`Translating referenced i18n keys only: ${referencedKeys.length} keys.`);
  for (const lang of langs) {
    await translateLanguage({ lang, sourceData, referencedKeys, force });
  }

  console.log('Translation run finished.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
