import fs from 'fs';

const HANJA_DATA = JSON.parse(fs.readFileSync('frontend/src/hanja_unified.json', 'utf8'));
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

// Simulate all days
const getHanjaForDay = (grade, day, hanjaPerDay=5) => {
    const gradeHanja = HANJA_DATA.filter(h => h.grade === grade);
    return gradeHanja.slice((day - 1) * hanjaPerDay, day * hanjaPerDay).map(h => h.id);
};

const grades = ['8급', '7급II', '7급', '6급II', '6급'];
let emptyCount = 0;
for (const grade of grades) {
    const gHanja = HANJA_DATA.filter(h => h.grade === grade);
    const totalDays = Math.ceil(gHanja.length / 5);
    for (let day = 1; day <= totalDays; day++) {
        const ids = getHanjaForDay(grade, day);
        const idioms = collectIdioms(ids);
        if (idioms.length === 0) {
            emptyCount++;
        }
    }
}
console.log(`Total empty stages: ${emptyCount}`);
