import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import IDIOMS data
import IDIOMS from '../frontend/src/data/idioms.js';

const execAsync = promisify(exec);

// Path to save MP3s
const OUT_DIR = path.resolve(__dirname, '../public/assets/audio/words');

async function main() {
    if (!fs.existsSync(OUT_DIR)) {
        fs.mkdirSync(OUT_DIR, { recursive: true });
    }

    // Get unique readings
    const readings = [...new Set(IDIOMS.map(i => i.reading.trim()))];
    console.log(`Found ${readings.length} unique idioms to process.`);

    let successCount = 0;

    for (const [idx, reading] of readings.entries()) {
        const mp3FileName = `word_${reading}.mp3`;
        const mp3Path = path.join(OUT_DIR, mp3FileName);
        const tempAiff = path.join(OUT_DIR, `temp_${Date.now()}.aiff`);

        if (fs.existsSync(mp3Path)) {
            console.log(`[${idx + 1}/${readings.length}] Skipping ${reading}, already exists.`);
            successCount++;
            continue;
        }

        try {
            console.log(`[${idx + 1}/${readings.length}] Generating: ${reading} -> ${mp3FileName}`);
            
            // 1. Generate AIFF using Mac TTS (Voice: Yuna)
            await execAsync(`say -v Yuna "${reading}" -o "${tempAiff}"`);

            // 2. Convert to MP3 using ffmpeg
            await execAsync(`ffmpeg -i "${tempAiff}" -b:a 64k "${mp3Path}" -y -loglevel error`);

            // 3. Cleanup temp file
            if (fs.existsSync(tempAiff)) fs.unlinkSync(tempAiff);

            successCount++;
        } catch (err) {
            console.error(` -> Error processing ${reading}:`, err.message);
            if (fs.existsSync(tempAiff)) fs.unlinkSync(tempAiff);
        }
    }
    
    console.log(`\nAll done! Successfully processed ${successCount}/${readings.length} idioms.`);
}

main().catch(console.error);
