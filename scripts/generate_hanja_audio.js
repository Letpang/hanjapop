#!/usr/bin/env node
/**
 * Google Cloud TTS로 한자 훈음 카드 음성 파일 일괄 생성
 * 출력: public/assets/audio/card_{ID}.mp3
 *
 * 사용법:
 *   node scripts/generate_hanja_audio.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const CSV_PATH = path.join(ROOT, 'hanja_recording_needed.csv');
const ENV_PATH = path.join(ROOT, 'frontend/.env');
const OUT_DIR_ROOT = path.join(ROOT, 'public/assets/audio');

const args = process.argv.slice(2);
const OVERWRITE = args.includes('--overwrite');
const VOICE = 'ko-KR-Neural2-A'; // Premium Neural2 female voice

// API Key configuration
let API_KEY = process.env.GOOGLE_TTS_API_KEY || process.env.VITE_GOOGLE_TTS_API_KEY;
if (!API_KEY && fs.existsSync(ENV_PATH)) {
    const envContent = fs.readFileSync(ENV_PATH, 'utf-8');
    const match = envContent.match(/VITE_GOOGLE_TTS_API_KEY=(.+)/);
    if (match) API_KEY = match[1].trim();
}

if (!API_KEY || API_KEY === '여기에_API_키_입력') {
    console.error('오류: API 키를 찾을 수 없습니다. frontend/.env 파일에 키를 올바르게 작성해 주세요.');
    process.exit(1);
}

// CSV Parsing (Line by line splitter)
const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);

const items = [];
for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length >= 5) {
        items.push({
            filename: parts[0],
            id: parts[1],
            hanja: parts[2],
            meaning: parts[3],
            sound: parts[4]
        });
    }
}

console.log(`총 한자 음성 생성 대상: ${items.length}개`);
console.log(`음성 엔진: ${VOICE} (Calm 0.8 rate, Soothing -1.0 pitch)`);

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
                speakingRate: 0.8, // Calm, peaceful speed matching user's taste
                pitch: -1.0,       // Slightly lower pitch for a softer, warmer voice
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

async function main() {
    if (!fs.existsSync(OUT_DIR_ROOT)) fs.mkdirSync(OUT_DIR_ROOT, { recursive: true });

    let done = 0, skipped = 0, failed = 0;
    const CONCURRENCY = 5;
    const queue = [...items];

    async function processOne(item) {
        const filename = `${item.filename}.mp3`;
        const pathRoot = path.join(OUT_DIR_ROOT, filename);

        if (!OVERWRITE && fs.existsSync(pathRoot)) {
            skipped++;
            return;
        }

        // Combine meaning and sound (훈음 결합, e.g. "하늘 천")
        const speakText = `${item.meaning} ${item.sound}`;

        try {
            const buf = await ttsRequest(speakText, VOICE);
            fs.writeFileSync(pathRoot, buf);
            done++;
            if (done % 20 === 0) {
                console.log(`  [${done + skipped + failed}/${items.length}] ${done}개 완료, ${skipped}개 스킵, ${failed}개 실패`);
            }
        } catch (e) {
            console.error(`  실패: ${speakText} - ${e.message}`);
            failed++;
        }

        // Avoid overloading Google Cloud API
        await new Promise(r => setTimeout(r, 60));
    }

    console.log(`\n한자 카드 음성 생성 시작 (동시 ${CONCURRENCY}개)...`);
    while (queue.length > 0) {
        const batch = queue.splice(0, CONCURRENCY);
        await Promise.all(batch.map(processOne));
    }

    console.log(`\n최종 완료: ${done}개 생성, ${skipped}개 스킵, ${failed}개 실패`);
    console.log(`루트 출력 위치: ${OUT_DIR_ROOT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
