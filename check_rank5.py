import os
from PIL import Image

for char in ['garae', 'jeolmi', 'chapssal', 'muzi']:
    filepath = f"public/assets/images/characters/{char}/rank_5.webp"
    if os.path.exists(filepath):
        img = Image.open(filepath).convert("RGBA")
        bg = Image.new('RGBA', img.size, (255, 0, 0, 255))
        bg.paste(img, (0, 0), img)
        bg.thumbnail((200, 200))
        bg.save(f"/Users/yangsujin/.gemini/antigravity-ide/brain/cb9f28a0-586b-4a7f-98a9-7808f3a3ee51/scratch/{char}_rank_5_test.png")
