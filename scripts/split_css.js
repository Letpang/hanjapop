const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../frontend/src/index.css');
const stylesDir = path.join(__dirname, '../frontend/src/styles');
const lines = fs.readFileSync(cssPath, 'utf8').split('\n');

const chunks = {
    base: [],
    components: [],
    animations: [],
    domain: []
};

let currentSection = 'base';

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Determine section based on line number (1-indexed)
    const num = i + 1;
    
    if (num <= 114) {
        currentSection = 'base';
    } else if (num >= 115 && num <= 401) {
        currentSection = 'components';
    } else if (num >= 402 && num <= 1711) {
        currentSection = 'domain';
    } else if (num >= 1712 && num <= 1822) {
        currentSection = 'animations';
    } else if (num >= 1823 && num <= 2969) {
        // Contains Modals, Bottom sheets, XP popups, Generic Overlays
        currentSection = 'components';
    } else {
        // Grade tests, Quiz bars, Daily screens, Match Game
        currentSection = 'domain';
    }

    chunks[currentSection].push(line);
}

// Write the split files
for (const [name, content] of Object.entries(chunks)) {
    fs.writeFileSync(path.join(stylesDir, `${name}.css`), content.join('\n'));
}

// Write the new index.css
const newIndex = `@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('./styles/base.css');
@import url('./styles/animations.css');
@import url('./styles/components.css');
@import url('./styles/domain.css');
`;

fs.writeFileSync(cssPath, newIndex);
console.log('CSS file split successfully!');
