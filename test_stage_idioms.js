import fs from 'fs';

const HANJA_DATA = JSON.parse(fs.readFileSync('frontend/src/hanja_unified.json', 'utf8'));
const idiomsText = fs.readFileSync('frontend/src/data/idioms.js', 'utf8');
const match = idiomsText.match(/const IDIOMS = (\[[\s\S]*?\]);/);
const IDIOMS = eval(match[1]);

const collectIdioms = (hanjaIds, grade) => {
    const idSet = new Set(hanjaIds);
    const seen = new Set();
    const result = [];
    const normalizedGrade = grade ? grade.replace(/II/g, 'Ⅱ') : null;
    
    for (const item of HANJA_DATA) {
        if (!idSet.has(item.id)) continue;
        for (const w of (item.words || [])) {
            if (w.type !== 'idiom' || seen.has(w.word)) continue;
            seen.add(w.word);
            const meta = IDIOMS.find(x => x.hanja === w.word);
            if (meta) {
                // If grade is provided, only include idioms from that grade
                if (!normalizedGrade || meta.grade === normalizedGrade) {
                    result.push({ ...meta, targetHanja: item.hanja });
                }
            }
        }
    }
    return result;
};

const day1Hanja = HANJA_DATA.filter(h => h.grade === '8급').slice(0, 5).map(h => h.id);
console.log("Day 1 8급 idioms:", collectIdioms(day1Hanja, '8급'));
