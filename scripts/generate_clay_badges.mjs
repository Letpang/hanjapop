import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const badgesDir = path.join(__dirname, '../public/assets/images/badges');

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
1. Ensure PERFECT anatomy. If drawing a hand or body, it MUST have exactly correct human proportions (e.g., exactly five distinct fingers).
2. Ensure PERFECT geometry. Objects should be solid and perfectly smooth without unexpected holes, cracks, or random tactile textures.
3. STRICT TEXT RULE: Do NOT generate any text, letters, Korean characters, Chinese characters, symbols, or labels.

Do NOT generate:
handcrafted tactile feel, gentle imperfections,
watercolor, storybook illustration, paper texture, flat vector art,
poster style, infographic style, emoji style, realistic rendering,
complex backgrounds, rounded-square app icon backgrounds.

Only generate:
simple memorable object,
clean 3D forms,
and isolated transparent PNG-style mobile UI assets.`;

const badges = [
    {
        id: 'brush',
        concept: "A premium 3D miniature badge. The badge has a thick, circular ceramic border frame resembling a medal. In the direct center of the badge, there is a black shield with a thick golden paintbrush pointing down embedded as a 3D relief. The entire image must have a perfectly smooth pastel clay, matte ceramic 3D render style."
    },
    {
        id: 'hanja',
        concept: "A premium 3D miniature badge. The badge has a thick, circular ceramic border frame resembling a medal. In the direct center of the badge, there is a red shield with a golden urn cup and a golden crown on top embedded as a 3D relief. The entire image must have a perfectly smooth pastel clay, matte ceramic 3D render style."
    },
    {
        id: 'quiz',
        concept: "A premium 3D miniature badge. The badge has a thick, circular ceramic border frame resembling a medal. In the direct center of the badge, there is a purple shield with a cute lightbulb with a face wearing a golden crown embedded as a 3D relief. The entire image must have a perfectly smooth pastel clay, matte ceramic 3D render style."
    }
];

async function generateSample(item) {
    const fullPrompt = `${commonPrompt}\n\nMain visual concept:\n${item.concept}`;
    console.log(`\nGenerating updated image for ${item.id}...`);
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

        const outPath = path.join(badgesDir, `test_badge_clay_${item.id}.png`);
        fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
        console.log(`Success! Image saved to: ${outPath}`);
    } catch (e) {
        console.error(`Generation failed for ${item.id}:`, e.message);
    }
}

async function run() {
    for (const item of badges) {
        await generateSample(item);
    }
    console.log("\nAll 6 badge generations completed.");
}

run();
