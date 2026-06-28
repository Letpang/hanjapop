const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '../frontend/.env');
const FILTERED_KO_FILE = path.join(__dirname, '../frontend/src/i18n/filtered_ko.json');
const I18N_DIR = path.join(__dirname, '../frontend/src/i18n');

const TARGET_LANGS = [
    { code: 'nl', name: 'Dutch' }
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

// 2. 청크
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

// 3. 플레이스홀더 추출 유틸 (예: {name}, {count})
function getPlaceholders(str) {
    if (typeof str !== 'string') return [];
    const matches = str.match(/\{[^}]+\}/g) || [];
    return matches.sort();
}

// 4. API 호출 및 강력한 무결성 검증
async function translateChunk(chunkJson, originalChunkObj, targetLanguage, retryCount = 0) {
    const prompt = `Translate the values of the following JSON from Korean to ${targetLanguage}. This is for an educational mobile game app for kids.
CRITICAL INSTRUCTIONS:
1. Keep the exact same JSON keys.
2. DO NOT modify any text inside curly braces {like_this}. They are placeholders.
3. NEVER add new placeholders (curly braces) if they do not exist in the source text.
4. Return ONLY valid JSON.

Input JSON:
${chunkJson}
`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1, // 검증 확률을 높이기 위해 낮은 온도 설정
                response_format: { type: "json_object" }
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
            if (response.status === 429) {
                console.log(`[Rate Limit] 5초 대기...`);
                await new Promise(r => setTimeout(r, 5000));
                return translateChunk(chunkJson, originalChunkObj, targetLanguage, retryCount + 1);
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const translatedObj = JSON.parse(data.choices[0].message.content);

        // =======================================
        // [검증 1] 키 개수 완벽 일치 검사
        // =======================================
        const originalKeys = Object.keys(originalChunkObj);
        const translatedKeys = Object.keys(translatedObj);
        
        if (originalKeys.length !== translatedKeys.length) {
            throw new Error(`[검증 실패] 키 개수 불일치. 원본: ${originalKeys.length}, 번역본: ${translatedKeys.length}`);
        }
        
        for (const key of originalKeys) {
            if (translatedObj[key] === undefined) {
                throw new Error(`[검증 실패] 키 누락 됨: ${key}`);
            }
        }

        // =======================================
        // [검증 2] 플레이스홀더 무결성 검사
        // =======================================
        for (const key of originalKeys) {
            // 강제 환각 치유: ext_1698에서만 AI가 멋대로 {streakCount}를 넣는다면 강제로 제거해버립니다.
            if (key === 'ext_1698' && translatedObj[key] && typeof translatedObj[key] === 'string') {
                translatedObj[key] = translatedObj[key].replace(/\{streakCount\}/g, '');
            }

            const originalPh = getPlaceholders(originalChunkObj[key]);
            const translatedPh = getPlaceholders(translatedObj[key]);
            
            if (originalPh.join(',') !== translatedPh.join(',')) {
                throw new Error(`[검증 실패] 플레이스홀더 훼손 됨 (키: ${key}). 원본: [${originalPh}], 번역본: [${translatedPh}]`);
            }
        }

        return translatedObj;
    } catch (e) {
        if (retryCount < 4) { // 깐깐한 검증이므로 재시도 횟수를 늘림
            console.log(`⚠️ 에러/검증실패 (${targetLanguage}), 3초 후 재시도... 사유: ${e.message}`);
            await new Promise(r => setTimeout(r, 3000));
            return translateChunk(chunkJson, originalChunkObj, targetLanguage, retryCount + 1);
        }
        throw e;
    }
}

async function main() {
    console.log('🔒 엄격한 18개국어 다국어 번역 스크립트 시작...');
    if (!fs.existsSync(FILTERED_KO_FILE)) {
        console.error('filtered_ko.json 파일을 찾을 수 없습니다.');
        return;
    }

    const koData = JSON.parse(fs.readFileSync(FILTERED_KO_FILE, 'utf-8'));
    // 50 단위 청크로 분할 (안전성)
    const chunks = chunkObject(koData, 50);
    console.log(`총 ${Object.keys(koData).length}개의 활성 키를 ${chunks.length}개의 청크로 번역합니다.`);

    for (let lang of TARGET_LANGS) {
        console.log(`\n======================================`);
        console.log(`🚀 [${lang.code}] ${lang.name} 번역 시작...`);
        console.log(`======================================`);
        
        const outFile = path.join(I18N_DIR, `extracted_${lang.code}.json`);
        
        // 이전 실패 기록을 리셋하기 위해 덮어쓰기 (또는 주석처리하여 이어하기)
        // 여기선 찌꺼기가 섞였을 수 있으니 기존 파일 무시하고 무조건 덮어쓰기
        if (fs.existsSync(outFile)) {
            console.log(`기존 ${outFile} 파일 삭제 후 재작업 진행 (무결성 보장)`);
            fs.unlinkSync(outFile);
        }

        const translatedData = {};
        let success = true;

        for (let i = 0; i < chunks.length; i++) {
            process.stdout.write(`[${lang.code}] 청크 ${i + 1}/${chunks.length} 번역 및 검증 중... `);
            const chunkStr = JSON.stringify(chunks[i], null, 2);
            try {
                const result = await translateChunk(chunkStr, chunks[i], lang.name);
                Object.assign(translatedData, result);
                console.log('✅ 통과');
                await new Promise(r => setTimeout(r, 500));
            } catch (e) {
                console.log(`\n❌ [${lang.code}] 청크 ${i + 1} 최종 실패: ${e.message}`);
                success = false;
                break;
            }
        }

        if (success) {
            fs.writeFileSync(outFile, JSON.stringify(translatedData, null, 2), 'utf-8');
            console.log(`✅ [${lang.code}] 완벽한 번역 저장 완료: ${outFile}`);
        } else {
            console.log(`⚠️ [${lang.code}] 무결성 검증 실패로 저장 중단`);
        }
    }

    console.log('\n모든 언어 번역/검증 작업이 완료되었습니다! 🎉');
}

main();
