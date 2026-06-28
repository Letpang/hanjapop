const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.join(__dirname, '../frontend/src');
const OUTPUT_FILE = path.join(TARGET_DIR, 'i18n/extracted_ko.json');

// 한글을 포함하는 문자열 추출 정규식
// 1. 따옴표나 백틱 안의 문자열
// 2. JSX 태그 사이의 순수 텍스트 >...<
const KOREAN_REGEX = /(['"`])([^'"`]*?[가-힣]+[^'"`]*)\1|>([^<>{}]*?[가-힣]+[^<>{}]*)</g;
const CODE_LIKE_REGEX = /(\}\}\>|\{[^}]+\}|className=|<\/?[A-Za-z][^>]*>|=>|\b(const|function|return|export|import)\b|\.filter\(|\.map\(|localStorage|useCallback|useEffect|\$\{)/;

function normalizeExtractedString(str) {
    return str
        .replace(/^[\s}>/]+/, '')
        .replace(/[\s<{/]+$/, '')
        .trim();
}

function shouldKeepString(str) {
    return /[가-힣]/.test(str) && !CODE_LIKE_REGEX.test(str);
}

function walkDir(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file === 'i18n') continue; // 다국어 폴더 자체는 제외
            walkDir(fullPath, fileList);
        } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

function extractKoreanStrings() {
    console.log('스캔 시작:', TARGET_DIR);
    const files = walkDir(TARGET_DIR);
    const extractedSet = new Set();

    files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        let match;
        while ((match = KOREAN_REGEX.exec(content)) !== null) {
            const raw = match[2] || match[3] || '';
            const str = normalizeExtractedString(raw);
            if (shouldKeepString(str)) {
                extractedSet.add(str);
            }
        }
    });

    // 객체로 변환 (자동 키 생성)
    const resultObj = {};
    let counter = 1;
    
    // 길이 순으로 정렬해서 보기 좋게 만듦
    const sortedStrings = Array.from(extractedSet).sort((a, b) => a.length - b.length);

    sortedStrings.forEach(str => {
        // 임시 키: ext_1, ext_2 ...
        resultObj[`ext_${counter++}`] = str;
    });

    // 디렉토리 없으면 생성
    const outDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(resultObj, null, 2), 'utf-8');
    console.log(`추출 완료! 총 ${sortedStrings.length}개의 고유 한국어 문구가 추출되었습니다.`);
    console.log(`결과 저장됨: ${OUTPUT_FILE}`);
}

extractKoreanStrings();
