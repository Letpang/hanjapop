const fs = require('fs');
const text = fs.readFileSync('frontend/src/data/dailyCurriculum.js', 'utf8');
const lines = text.split('\n');
let jsonText = '[' + text.split('export const dailyCurriculum = [')[1].split('];')[0] + ']';
// Just use a regex to extract day and hanjas
const curriculumMatch = text.match(/day:\s*(\d+),\s*hanja:\s*\[([\s\S]*?)\]/g);
let charToDay = {};
if(curriculumMatch) {
  curriculumMatch.forEach(m => {
     let dMatch = m.match(/day:\s*(\d+)/);
     let d = parseInt(dMatch[1]);
     let chars = m.match(/hanja:\s*"([^"]+)"/g);
     if (chars) {
        chars.forEach(c => {
           let ch = c.match(/"([^"]+)"/)[1];
           charToDay[ch] = d;
        });
     }
  });
}
// since the regex above doesn't match the new structure, I'll read it by executing it:
