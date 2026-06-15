import os
from PIL import Image

for root, dirs, files in os.walk("public/assets/images/characters"):
    for file in files:
        if file.lower().endswith(".webp") or file.lower().endswith(".png"):
            filepath = os.path.join(root, file)
            img = Image.open(filepath).convert("RGBA")
            width, height = img.size
            
            # Find the bounding box of non-transparent pixels
            bbox = img.getbbox()
            if not bbox:
                continue
                
            left, upper, right, lower = bbox
            # Check the pixels along the bounding box
            opaque_white_count = 0
            total_edge_pixels = 0
            
            # just sample along the left edge of the bbox
            for y in range(upper, lower):
                r, g, b, a = img.getpixel((left, y))
                if a > 200 and r > 240 and g > 240 and b > 240:
                    opaque_white_count += 1
                total_edge_pixels += 1
                
            if total_edge_pixels > 0 and opaque_white_count / total_edge_pixels > 0.5:
                print(f"{filepath} might have a solid white background! (bbox edge is mostly white)")
