const fs = require('fs');
const path = '/Users/yangsujin/dev/스토어_업로드_최신본/frontend/src/hanja_unified.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

let modifiedCount = 0;

for (let item of data) {
    if (!item.words) continue;
    for (let w of item.words) {
        if (w.example && !w.example.includes('(')) {
            let original = w.example;
            if (w.example.includes(w.word)) {
                w.example = w.example.replace(w.word, '( )');
                modifiedCount++;
                console.log(`[Fixed by Hanja] ${w.word}: ${original} -> ${w.example}`);
            } else if (w.example.includes(w.reading)) {
                w.example = w.example.replace(w.reading, '( )');
                modifiedCount++;
                console.log(`[Fixed by Reading] ${w.word}: ${original} -> ${w.example}`);
            } else {
                console.log(`[NOT FIXED] ${w.word}: ${w.example}`);
            }
        }
    }
}

console.log(`Modified ${modifiedCount} examples.`);
fs.writeFileSync(path, JSON.stringify(data, null, 4), 'utf8');
