const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '../frontend/.env');
const KO_FILE = path.join(__dirname, '../frontend/src/i18n/extracted_ko.json');
const TARGET_DIRS = [
    path.join(__dirname, '../frontend/src/screens'),
    path.join(__dirname, '../frontend/src/components')
];

// 1. .env 파싱
function getOpenAIKey() {
    if (!fs.existsSync(ENV_PATH)) return null;
    const envContent = fs.readFileSync(ENV_PATH, 'utf-8');
    for (const line of envContent.split('\n')) {
        const [key, ...rest] = line.split('=');
        if (key.trim() === 'OPENAI_API_KEY') {
            return rest.join('=').trim();
        }
    }
    return null;
}

const API_KEY = getOpenAIKey();
if (!API_KEY) {
    console.error('OPENAI_API_KEY가 .env 파일에 없습니다.');
    process.exit(1);
}

// 2. 파일 목록 수집 (.jsx, .tsx 전용 필터링)
function walkDir(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath, fileList);
        } else if (/\.(jsx|tsx)$/.test(file)) { // JS, TS는 철저히 배제
            fileList.push(fullPath);
        }
    }
    return fileList;
}

// 3. 상대 경로 계산기
function getRelativePathToHooks(filePath) {
    const hooksDir = path.join(__dirname, '../frontend/src/hooks');
    const fileDir = path.dirname(filePath);
    let relPath = path.relative(fileDir, hooksDir);
    if (!relPath.startsWith('.')) relPath = './' + relPath;
    return relPath + '/useLang.js'; // 또는 .ts
}

// 4. API 호출 및 Backoff 로직
async function replaceCodeWithAI(filePath, content, dictMap, retryCount = 0) {
    const relativeHookPath = getRelativePathToHooks(filePath);
    
    const relevantKeys = {};
    let hasKorean = false;
    for (const [key, text] of Object.entries(dictMap)) {
        if (content.includes(text)) {
            relevantKeys[key] = text;
            hasKorean = true;
        }
    }

    if (!hasKorean) return null;

    const prompt = `You are an expert React developer. Refactor the following React Component to support i18n.
Here are the exact Korean strings found in this file and their i18n keys:
${JSON.stringify(relevantKeys, null, 2)}

Instructions:
1. Replace the Korean strings in the JSX/Code with \`t('KEY')\` or \`{t('KEY')}\` where appropriate.
2. Ensure you import useLang: \`import { useLang } from '${relativeHookPath}';\`
3. Inject the hook inside the functional component body: \`const { t } = useLang();\`
4. Only change strings that match the provided keys. Leave the rest of the component logic perfectly intact.
5. Output ONLY the raw refactored code. Do not wrap it in markdown code blocks like \`\`\`jsx. Do not add any text.

Source Code:
${content}
`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // 대규모 처리를 위해 mini 사용 (비용 및 속도 최적화, 컴포넌트 변환은 mini도 충분함)
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1
            })
        });

        if (!response.ok) {
            if (response.status === 429) {
                console.log(`[Rate Limit] 429 에러. 5초 대기 후 재시도... (${retryCount + 1}/5)`);
                await new Promise(r => setTimeout(r, 5000));
                if (retryCount < 5) return replaceCodeWithAI(filePath, content, dictMap, retryCount + 1);
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        let refactoredCode = data.choices[0].message.content;
        
        // 마크다운 제거 보정
        refactoredCode = refactoredCode.replace(/^```[\w]*\n/, '').replace(/\n```$/, '');
        return refactoredCode;
    } catch (e) {
        if (retryCount < 3) {
            console.log(`[재시도] 네트워크 에러. 3초 대기 후 재시도... (${retryCount + 1}/3)`);
            await new Promise(r => setTimeout(r, 3000));
            return replaceCodeWithAI(filePath, content, dictMap, retryCount + 1);
        }
        throw e;
    }
}

async function main() {
    console.log('대규모 AI 치환 시작 (.jsx, .tsx 전용)...');
    if (!fs.existsSync(KO_FILE)) {
        console.error('extracted_ko.json 파일을 찾을 수 없습니다.');
        return;
    }

    const koData = JSON.parse(fs.readFileSync(KO_FILE, 'utf-8'));
    
    let allFiles = [];
    TARGET_DIRS.forEach(dir => {
        allFiles = allFiles.concat(walkDir(dir));
    });

    console.log(`총 ${allFiles.length}개의 컴포넌트 파일을 검사합니다.`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i];
        const content = fs.readFileSync(file, 'utf-8');
        
        if (!/[가-힣]/.test(content)) {
            skipCount++;
            continue;
        }

        console.log(`[${i + 1}/${allFiles.length}] ${path.basename(file)} 스캔 중...`);
        try {
            const newContent = await replaceCodeWithAI(file, content, koData);
            if (newContent) {
                fs.writeFileSync(file, newContent, 'utf-8');
                console.log(`✅ [성공] ${path.basename(file)}`);
                successCount++;
                // API 속도 조절을 위해 약간 대기
                await new Promise(r => setTimeout(r, 500)); 
            } else {
                console.log(`⏭️ [패스] ${path.basename(file)}`);
                skipCount++;
            }
        } catch (e) {
            console.error(`❌ [에러] ${path.basename(file)} 처리 실패:`, e.message);
            errorCount++;
        }
    }
    console.log('\n--- 작업 완료 ---');
    console.log(`성공: ${successCount}개`);
    console.log(`패스: ${skipCount}개 (한글 없거나 사전 미일치)`);
    console.log(`에러: ${errorCount}개`);
}

main();
