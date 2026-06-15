import fs from 'fs';
const data = JSON.parse(fs.readFileSync('frontend/src/hanja_unified.json', 'utf8'));
const h = data.find(x => x.id === 1);
const idioms = h.words.filter(w => w.type === 'idiom');
console.log('Idioms for Hanja 1:', idioms.length);
