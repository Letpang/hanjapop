const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../frontend/src/index.css');
let content = fs.readFileSync(cssPath, 'utf8');
const original = content;

// Remove all '!important' declarations, handling possible spaces before the semicolon
content = content.replace(/\s*!important/g, '');

if (content !== original) {
    fs.writeFileSync(cssPath, content);
    console.log('Removed all !important tags from index.css');
} else {
    console.log('No !important tags found.');
}
