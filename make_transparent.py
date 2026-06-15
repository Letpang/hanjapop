import os
from PIL import Image
from rembg import remove

char_dir = "public/assets/images/characters"

def process_image(filepath):
    try:
        input_image = Image.open(filepath).convert("RGBA")
        
        # Check if the image ALREADY has a fully transparent background.
        # We can check the alpha variance or just run rembg on all.
        # Actually, if rembg is run on an already transparent image, it works fine.
        
        output_image = remove(input_image)
        
        # Save it
        output_image.save(filepath, "WEBP", quality=100)
        print(f"Processed {filepath}")
    except Exception as e:
        print(f"Error on {filepath}: {e}")

for root, dirs, files in os.walk(char_dir):
    # skip backup dir
    if "backup" in root: continue
    for file in files:
        if file.lower().endswith(".webp") or file.lower().endswith(".png"):
            filepath = os.path.join(root, file)
            process_image(filepath)

