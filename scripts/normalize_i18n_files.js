const fs = require('fs');
const path = require('path');
const {
  i18nDir,
  normalizeI18nValue,
  readJson,
  writeJson,
} = require('./i18n_utils.js');

function main() {
  const files = fs.readdirSync(i18nDir)
    .filter((file) => /^extracted_.+\.json$/.test(file))
    .sort();

  let changedFiles = 0;
  let changedValues = 0;

  for (const file of files) {
    const filePath = path.join(i18nDir, file);
    const data = readJson(filePath);
    let changed = false;

    for (const [key, value] of Object.entries(data)) {
      const normalized = normalizeI18nValue(value);
      if (normalized !== value) {
        data[key] = normalized;
        changed = true;
        changedValues += 1;
      }
    }

    if (changed) {
      writeJson(filePath, data);
      changedFiles += 1;
    }
  }

  console.log(`Normalized ${changedValues} values in ${changedFiles} files.`);
}

main();
