import fs from 'fs';

const HANJA_DATA = JSON.parse(fs.readFileSync('frontend/src/hanja_unified.json', 'utf8'));

// Assuming idioms.js exports IDIOMS, but it's a JS file. Let's extract it.
const idiomsText = fs.readFileSync('frontend/src/data/idioms.js', 'utf8');
const match = idiomsText.match(/const IDIOMS = (\[[\s\S]*?\]);/);
const IDIOMS = eval(match[1]);

const collectIdioms = (hanjaIds) => {
    const idSet = new Set(hanjaIds);
    const seen = new Set();
    const result = [];
    for (const item of HANJA_DATA) {
        if (!idSet.has(item.id)) continue;
        for (const w of (item.words || [])) {
            if (w.type !== 'idiom' || seen.has(w.word)) continue;
            seen.add(w.word);
            const meta = IDIOMS.find(x => x.hanja === w.word);
            if (meta) result.push({ ...meta, targetHanja: item.hanja });
        }
    }
    return result;
};

const day1Hanja = HANJA_DATA.filter(h => h.grade === '8급').slice(0, 5).map(h => h.id);
console.log("Day 1 8급 Hanja IDs:", day1Hanja);
const idioms = collectIdioms(day1Hanja);
console.log("Found idioms:", idioms.length);
