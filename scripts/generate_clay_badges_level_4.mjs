import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const badgesDir = path.join(__dirname, '../public/assets/images/badges/test_generated');

const apiKey = process.env.OPENAI_API_KEY;

const commonPrompt = `minimal soft 3D educational app icon,
premium mobile UI asset,
clean miniature object design,
simple clay-like 3D rendering,
soft matte ceramic material,
rounded soft forms,
front-facing composition,
isolated object scene,
transparent background,
centered layout,
clean silhouette,
mobile app readability,
minimal composition,
soft ambient studio lighting,
subtle shadow,
low-saturation pastel colors only.

Style reference:
premium Korean educational mobile app,
Duolingo-style UI asset,
cute but refined,
calm and modern,
soft 3D UI object system,
perfectly smooth, elegant, and minimal.

Important Directives for AI:
1. Ensure PERFECT anatomy.
2. Ensure PERFECT geometry.
3. STRICT TEXT RULE: Do NOT generate any text, letters, characters, symbols, or labels.`;

// Level 4: Maintain crown, but remove wings/extra ornaments. Slightly simpler than Level 5.
const badgesLevel4 = [
    {
        id: 'attendance',
        concept: "A premium 3D miniature badge. Level 4 version. The badge has a thick, circular white ceramic border frame resembling a medal. In the direct center, there is a green chalice with a golden crown on top and an hourglass embedded as a 3D relief. No extra banners or ribbons. The entire image must have a perfectly smooth pastel clay, matte ceramic 3D render style."
    },
    {
        id: 'mission',
        concept: "A premium 3D miniature badge. Level 4 version. The badge has a thick, circular white ceramic border frame resembling a medal. In the direct center, there is a purple shield with a glowing purple orb with a neuron network pattern and a golden crown on top embedded as a 3D relief. No wings or extra ornaments. The entire image must have a perfectly smooth pastel clay, matte ceramic 3D render style."
    },
    {
        id: 'game',
        concept: "A premium 3D miniature badge. Level 4 version. The badge has a thick, circular white ceramic border frame resembling a medal. In the direct center, there is a red shield with a fiery bearded king face wearing a golden crown embedded as a 3D relief. No extra ribbons or text. The entire image must have a perfectly smooth pastel clay, matte ceramic 3D render style."
    },
    {
        id: 'brush',
        concept: "A premium 3D miniature badge. Level 4 version. The badge has a thick, circular white ceramic border frame resembling a medal. In the direct center, there is a black shield with a thick golden paintbrush pointing down and a golden crown on top embedded as a 3D relief. No stars or ribbons around it. The entire image must have a perfectly smooth pastel clay, matte ceramic 3D render style."
    },
    {
        id: 'hanja',
        concept: "A premium 3D miniature badge. Level 4 version. The badge has a thick, circular white ceramic border frame resembling a medal. In the direct center, there is a red shield with a golden urn cup and a golden crown on top embedded as a 3D relief. Simpler frame, no ribbons. The entire image must have a perfectly smooth pastel clay, matte ceramic 3D render style."
    },
    {
        id: 'quiz',
        concept: "A premium 3D miniature badge. Level 4 version. The badge has a thick, circular white ceramic border frame resembling a medal. In the direct center, there is a purple shield with a cute lightbulb with a face wearing a golden crown embedded as a 3D relief. No extra ornaments or ribbons. The entire image must have a perfectly smooth pastel clay, matte ceramic 3D render style."
    }
];

async function generateSample(item) {
    const fullPrompt = `${commonPrompt}\n\nMain visual concept:\n${item.concept}`;
    console.log(`\nGenerating Level 4 image for ${item.id}...`);
    try {
        const response = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-image-1.5",
                prompt: fullPrompt,
                size: "1024x1024"
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`API Error ${response.status}: ${errorData}`);
        }

        const data = await response.json();
        const b64 = data.data[0].b64_json;
        if (!b64) {
            throw new Error("No b64_json in response");
        }

        if (!fs.existsSync(badgesDir)){
            fs.mkdirSync(badgesDir, { recursive: true });
        }
        
        const outPath = path.join(badgesDir, `test_badge_clay_${item.id}_level4.png`);
        fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
        console.log(`Success! Image saved to: ${outPath}`);
    } catch (e) {
        console.error(`Generation failed for ${item.id}:`, e.message);
    }
}

async function run() {
    for (const item of badgesLevel4) {
        await generateSample(item);
    }
    console.log("\nAll 6 Level 4 badge generations completed.");
}

run();
