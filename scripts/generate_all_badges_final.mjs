import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const badgesDir = path.join(__dirname, '../public/assets/images/badges/final_clay');

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
2. Ensure PERFECT geometry. Objects should be solid and perfectly smooth without unexpected holes, cracks, or random tactile textures.
3. STRICT TEXT RULE: Do NOT generate any text, letters, characters, symbols, or labels.

Do NOT generate:
glossy plastic, metallic reflections, shiny gems, realistic textures, complex backgrounds.`;

const levels = {
    1: { color: "warm coral brown (terracotta clay tone)", frame: "simple circular" },
    2: { color: "soft light grey (pastel silver tone)", frame: "circular" },
    3: { color: "pastel mustard yellow (matte gold tone)", frame: "thick circular" },
    4: { color: "soft pastel rose/red (matte ruby tone)", frame: "thick ornate circular" },
    5: { color: "pale icy blue and white (matte diamond tone)", frame: "grand, majestic thick circular" }
};

const categories = {
    attendance: {
        1: "In the center, a tiny, single ember or very small candle flame.",
        2: "In the center, a solid campfire flame resting on a small stone base.",
        3: "In the center, a glowing magical flame burning on a torch.",
        4: "In the center, a majestic soaring flame on an ornate pedestal.",
        5: "In the center, a spectacular radiant eternal flame with floating sparks on a holy brazier with a golden crown."
    },
    mission: {
        1: "In the center, a small single glowing glass bead.",
        2: "In the center, a magical glowing orb.",
        3: "In the center, a bright orb with a subtle neuron network pattern.",
        4: "In the center, a glowing purple orb with a neuron network pattern and small wings.",
        5: "In the center, a magnificent glowing purple neuron network orb with golden wings and a crown."
    },
    game: {
        1: "In the center, a cute small monster face.",
        2: "In the center, a cute monster face with small horns.",
        3: "In the center, a fiery monster face.",
        4: "In the center, a fiery bearded monster king face wearing a crown.",
        5: "In the center, a colossal fiery bearded monster king face wearing a crown, embedded in a shield."
    },
    brush: {
        1: "In the center, a small simple paintbrush tip.",
        2: "In the center, a simple paintbrush.",
        3: "In the center, a glowing golden paintbrush.",
        4: "In the center, a glowing golden paintbrush surrounded by small subtle stars.",
        5: "In the center, a magnificent golden magic paintbrush with a crown and a radiant aura."
    },
    hanja: {
        1: "In the center, a small simple flag.",
        2: "In the center, a waving flag.",
        3: "In the center, a flag planted on a mountain peak.",
        4: "In the center, a golden conqueror's crown.",
        5: "In the center, a magnificent glowing conqueror's crown resting on top of a mountain peak."
    },
    quiz: {
        1: "In the center, a tiny simple lightbulb.",
        2: "In the center, a glowing lightbulb.",
        3: "In the center, a cute lightbulb with a face.",
        4: "In the center, a cute lightbulb with a face and decorative elements.",
        5: "In the center, a magnificent cute lightbulb with a face wearing a golden crown."
    }
};

const allBadges = [];
for (const [catId, levelsData] of Object.entries(categories)) {
    for (let level = 1; level <= 5; level++) {
        const frameColor = levels[level].color;
        const frameStyle = levels[level].frame;
        const concept = `A premium 3D miniature badge. Level ${level} version. The badge has a ${frameStyle} ${frameColor} ceramic border frame resembling a medal. ${levelsData[level]} The entire image must have a perfectly smooth pastel clay, matte ceramic 3D render style.`;
        allBadges.push({ id: catId, level, concept });
    }
}

async function generateSample(item) {
    const fullPrompt = `${commonPrompt}\n\nMain visual concept:\n${item.concept}`;
    console.log(`\nGenerating Level ${item.level} image for ${item.id}...`);
    try {
        const outPath = path.join(badgesDir, `badge_3d_${item.id}_${item.level}.png`);
        if (fs.existsSync(outPath)) {
            console.log(`Skipping ${item.id} level ${item.level} because it already exists.`);
            return;
        }

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
        if (!b64) throw new Error("No b64_json in response");

        if (!fs.existsSync(badgesDir)) fs.mkdirSync(badgesDir, { recursive: true });
        
        fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
        console.log(`Success! Image saved to: ${outPath}`);
    } catch (e) {
        console.error(`Generation failed for ${item.id} level ${item.level}:`, e.message);
    }
}

async function run() {
    console.log(`Starting generation for ${allBadges.length} badges...`);
    for (const item of allBadges) {
        await generateSample(item);
        // Add a 2 second delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    console.log("\nAll badge generations completed.");
}

run();
