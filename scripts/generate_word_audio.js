#!/usr/bin/env node
/**
 * Google Cloud TTS로 단어 음성 파일 생성
 * 출력: public/assets/audio/words/word_{reading}.mp3
 *
 * 사용법:
 *   GOOGLE_TTS_API_KEY=<키> node scripts/generate_word_audio.js
 *   또는 .env에 VITE_GOOGLE_TTS_API_KEY 설정 후 실행
 *
 * 옵션:
 *   --voice ko-KR-Neural2-A   (기본값, A=여성)
 *   --dry-run                 실제 API 호출 없이 목록만 출력
 *   --resume                  이미 생성된 파일 건너뜀 (기본값)
 *   --overwrite               기존 파일 덮어씀
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ── 설정 ──────────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'frontend/src/hanja_unified.json');
const OUT_DIR = path.join(ROOT, 'public/assets/audio/words');
const ENV_PATH = path.join(ROOT, 'frontend/.env');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const OVERWRITE = args.includes('--overwrite');
const VOICE_ARG = args.find(a => a.startsWith('--voice='))?.split('=')[1]
    || (args[args.indexOf('--voice') + 1] !== undefined && !args[args.indexOf('--voice') + 1]?.startsWith('--') ? args[args.indexOf('--voice') + 1] : null)
    || 'ko-KR-Neural2-A';

// API 키: 환경변수 > .env 파일
let API_KEY = process.env.GOOGLE_TTS_API_KEY || process.env.VITE_GOOGLE_TTS_API_KEY;
if (!API_KEY && fs.existsSync(ENV_PATH)) {
    const envContent = fs.readFileSync(ENV_PATH, 'utf-8');
    const match = envContent.match(/VITE_GOOGLE_TTS_API_KEY=(.+)/);
    if (match) API_KEY = match[1].trim();
}

// ── 단어 목록 추출 ─────────────────────────────────────────────────────────
const hanjaData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const wordMap = new Map(); // reading → { word, reading }
for (const h of hanjaData) {
    if (!h.words) continue;
    for (const w of h.words) {
        if (w.word && w.reading && !wordMap.has(w.reading)) {
            wordMap.set(w.reading, { word: w.word, reading: w.reading });
        }
    }
}

const allWords = [...wordMap.values()];
console.log(`총 고유 단어(reading 기준): ${allWords.length}개`);
console.log(`보이스: ${VOICE_ARG}`);
console.log(`출력 디렉토리: ${OUT_DIR}`);

if (DRY_RUN) {
    console.log('\n[DRY RUN] 처음 10개 미리보기:');
    allWords.slice(0, 10).forEach(w => console.log(`  ${w.reading} (${w.word}) → word_${w.reading}.mp3`));
    process.exit(0);
}

if (!API_KEY || API_KEY === '여기에_API_키_입력') {
    console.error('\n오류: API 키가 설정되지 않았습니다.');
    console.error('frontend/.env 파일에 VITE_GOOGLE_TTS_API_KEY=<실제키> 를 입력하거나');
    console.error('GOOGLE_TTS_API_KEY=<키> node scripts/generate_word_audio.js 로 실행하세요.');
    process.exit(1);
}

// ── API 호출 ──────────────────────────────────────────────────────────────
function ttsRequest(text, voice) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({
            input: { text },
            voice: {
                languageCode: 'ko-KR',
                name: voice,
            },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: 0.9,
                pitch: 0,
            },
        });

        const options = {
            hostname: 'texttospeech.googleapis.com',
            path: `/v1/text:synthesize?key=${API_KEY}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) return reject(new Error(`API 오류: ${JSON.stringify(parsed.error)}`));
                    if (!parsed.audioContent) return reject(new Error('audioContent 없음'));
                    resolve(Buffer.from(parsed.audioContent, 'base64'));
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// ── 메인 루프 ─────────────────────────────────────────────────────────────
async function main() {
    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

    let done = 0, skipped = 0, failed = 0;
    const CONCURRENCY = 5;
    const queue = [...allWords];

    async function processOne(w) {
        const filename = `word_${w.reading}.mp3`;
        const outPath = path.join(OUT_DIR, filename);

        if (!OVERWRITE && fs.existsSync(outPath)) {
            skipped++;
            return;
        }

        try {
            const buf = await ttsRequest(w.reading, VOICE_ARG);
            fs.writeFileSync(outPath, buf);
            done++;
            if (done % 50 === 0) {
                console.log(`  [${done + skipped + failed}/${allWords.length}] ${done}개 완료, ${skipped}개 스킵, ${failed}개 실패`);
            }
        } catch (e) {
            console.error(`  실패: ${w.reading} (${w.word}) - ${e.message}`);
            failed++;
        }

        // API 과부하 방지: 요청 사이 최소 간격
        await new Promise(r => setTimeout(r, 50));
    }

    // 배치 처리
    console.log(`\n생성 시작 (동시 ${CONCURRENCY}개)...`);
    while (queue.length > 0) {
        const batch = queue.splice(0, CONCURRENCY);
        await Promise.all(batch.map(processOne));
    }

    console.log(`\n완료: ${done}개 생성, ${skipped}개 스킵, ${failed}개 실패`);
    console.log(`파일 위치: ${OUT_DIR}`);
}

main().catch(e => { console.error(e); process.exit(1); });
