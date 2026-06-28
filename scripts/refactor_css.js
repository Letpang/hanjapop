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

            // 1. 공통 카드 스타일을 시맨틱 클래스로 대체
            const premiumPanelRegex = /className="([^"]*)rounded-\[2rem\] border border-white bg-white([^"]*)shadow-sm dark:border-slate-700 dark:bg-slate-800([^"]*)"/g;
            content = content.replace(premiumPanelRegex, (match, p1, p2, p3) => {
                const cleaned = `className="${p1}premium-panel${p2}${p3}"`.replace(/  +/g, ' ');
                return cleaned;
            });

            // 2. 전체 화면 래퍼에서 불필요한 배경/텍스트 유틸리티 제거
            content = content.replace(/bg-\[#F7FAF9\] text-\[#334155\] dark:bg-slate-900 dark:text-white/g, '');
            content = content.replace(/bg-\[#F7FAF9\] dark:bg-slate-900 text-\[#334155\] dark:text-slate-200 dark:bg-slate-900 dark:text-white/g, '');
            content = content.replace(/bg-\[#F8FAFC\] dark:bg-slate-900/g, '');
            content = content.replace(/bg-\[#F7FAF9\] dark:bg-slate-900/g, '');

            // 3. 컴포넌트 단위 배경/테두리 스타일을 CSS 변수로 대체
            content = content.replace(/bg-white dark:bg-slate-[0-9]{3}/g, 'bg-[var(--color-bg-surface)]');
            content = content.replace(/border-white dark:border-slate-[0-9]{3}/g, 'border-[var(--color-border-subtle)]');

            if (content !== original) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

const targetDir = path.join(__dirname, '../frontend/src/screens');
console.log(`Running CSS refactor on ${targetDir}`);
processDir(targetDir);
console.log('Done.');
