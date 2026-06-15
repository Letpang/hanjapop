import os
from PIL import Image

for root, dirs, files in os.walk("public/assets/images/characters"):
    for file in files:
        if file.lower().endswith(".webp") or file.lower().endswith(".png"):
            filepath = os.path.join(root, file)
            img = Image.open(filepath).convert("RGBA")
            width, height = img.size
            
            # Check a bit inside the image, not just 0,0
            # E.g., a border of 5 pixels
            bg_pixels = 0
            for x in range(width):
                for y in (0, height-1):
                    if img.getpixel((x, y))[3] > 200:
                        bg_pixels += 1
            for y in range(height):
                for x in (0, width-1):
                    if img.getpixel((x, y))[3] > 200:
                        bg_pixels += 1
                        
            if bg_pixels > 10:
                print(f"{filepath} has {bg_pixels} opaque pixels on border!")
