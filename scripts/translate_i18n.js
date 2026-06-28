const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '../frontend/.env');
const KO_FILE = path.join(__dirname, '../frontend/src/i18n/extracted_ko.json');
const EN_FILE = path.join(__dirname, '../frontend/src/i18n/extracted_en.json');

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

// 2. 데이터 청크로 나누기 (100개씩)
function chunkObject(obj, size) {
    const keys = Object.keys(obj);
    const chunks = [];
    for (let i = 0; i < keys.length; i += size) {
        const chunk = {};
        keys.slice(i, i + size).forEach(k => {
            chunk[k] = obj[k];
        });
        chunks.push(chunk);
    }
    return chunks;
}

// 3. OpenAI API 호출
async function translateChunk(chunkJson, retryCount = 0) {
    const prompt = `Translate the values of the following JSON from Korean to English. This is for an educational mobile game app for kids.
Keep the JSON keys exactly the same.
Ensure the translation sounds natural, friendly, and kid-appropriate.
Return ONLY valid JSON. Do not include markdown code blocks like \`\`\`json. Just the JSON object.

Input JSON:
${chunkJson}
`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        return JSON.parse(content);
    } catch (e) {
        if (retryCount < 3) {
            console.log('번역 실패, 3초 후 재시도...', e.message);
            await new Promise(r => setTimeout(r, 3000));
            return translateChunk(chunkJson, retryCount + 1);
        }
        throw e;
    }
}

async function main() {
    console.log('다국어 번역 스크립트 시작...');
    if (!fs.existsSync(KO_FILE)) {
        console.error('extracted_ko.json 파일을 찾을 수 없습니다.');
        return;
    }

    const koData = JSON.parse(fs.readFileSync(KO_FILE, 'utf-8'));
    const chunks = chunkObject(koData, 100);
    console.log(`총 ${Object.keys(koData).length}개의 단어를 ${chunks.length}번의 API 호출로 번역합니다.`);

    const enData = {};

    for (let i = 0; i < chunks.length; i++) {
        console.log(`[${i + 1}/${chunks.length}] 청크 번역 중...`);
        const chunkStr = JSON.stringify(chunks[i], null, 2);
        try {
            const result = await translateChunk(chunkStr);
            Object.assign(enData, result);
        } catch (e) {
            console.error(`청크 ${i + 1} 번역 중 치명적 오류 발생:`, e);
            // 에러 나더라도 여태까지 번역한 건 저장
            break;
        }
    }

    fs.writeFileSync(EN_FILE, JSON.stringify(enData, null, 2), 'utf-8');
    console.log(`번역 완료! 결과가 저장되었습니다: ${EN_FILE}`);
}

main();
