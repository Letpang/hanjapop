import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("OPENAI_API_KEY is missing in .env");
  process.exit(1);
}

const items = [
  { name: "ticket", desc: "single, elegantly designed admission ticket for a Korean palace with traditional patterns" },
  { name: "hanbok", desc: "single, beautifully designed traditional korean hanbok" },
  { name: "free", desc: "single, beautifully designed free gift box or token" },
  { name: "entrance", desc: "single, elegant and welcoming entrance or door" },
  { name: "map", desc: "single, decorative and beautiful travel map" }
];

async function run() {
  console.log("Starting DALL-E 3 image generation...");
  for (const item of items) {
    console.log(`\nGenerating image for: ${item.name}...`);
    // The prompt is constructed based on the user's specific styling request
    const prompt = `An illustration of a ${item.desc}, flat pastel illustration, soft clean korean lifestyle illustration, modern cozy mobile app aesthetic, clean thin lineart, soft pastel colors, gentle soft shading, subtle highlights, minimal but elegant detail, white background, centered composition, large empty negative space, premium casual korean aesthetic, cute but refined, 2D illustration, single main object focus, small floating decorative elements like tiny pastel hearts, tiny sparkles, small music notes, and a small leaf branch accent. absolutely NO TEXT, NO LETTERS, NO WORDS.`;
    
    try {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-image-1.5",
          prompt: prompt,
          n: 1,
          size: "1536x1024" // 3:2 widescreen format natively supported by gpt-image-1.5
        })
      });

      if (!response.ok) {
        console.error(`API Error for ${item.name}:`);
        console.error(await response.text());
        continue;
      }

      const data = await response.json();
      const imageUrl = data.data[0].url;
      const imgResponse = await fetch(imageUrl);
      const buffer = Buffer.from(await imgResponse.arrayBuffer());

      const outputPath = path.join(__dirname, "src", "assets", "images", `${item.name}.png`);
      fs.writeFileSync(outputPath, buffer);
      console.log(`Saved raw image for ${item.name}`);

      // Resize width to 1024, height scales proportionally to ~683
      execSync(`sips -z 683 1024 "${outputPath}"`);
      // Crop exactly to 1024x576 from the center
      execSync(`sips -c 576 1024 "${outputPath}"`);
      console.log(`Successfully resized and cropped ${item.name}.png to 1024x576`);
    } catch (err) {
      console.error(`Failed to generate ${item.name}:`, err.message);
    }
  }
  console.log("\nAll images have been generated and processed!");
}

run().catch(console.error);
