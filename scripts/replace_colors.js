const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // Replace specific hardcoded hex colors with CSS variable references
            content = content.replace(/text-\[#4A51D4\]/g, 'text-[color:var(--color-primary-blue)]');
            content = content.replace(/text-\[#5B677A\]/g, 'text-[color:var(--color-text-muted)]');
            content = content.replace(/'#4A51D4'/g, "'var(--color-primary-blue)'");
            content = content.replace(/'#5B677A'/g, "'var(--color-text-muted)'");
            content = content.replace(/"#4A51D4"/g, '"var(--color-primary-blue)"');
            content = content.replace(/"#5B677A"/g, '"var(--color-text-muted)"');

            if (content !== original) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated colors in ${fullPath}`);
            }
        }
    }
}

const targetDir = path.join(__dirname, '../frontend/src');
console.log(`Running color replacement on ${targetDir}`);
processDir(targetDir);
console.log('Done.');
