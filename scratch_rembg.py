import os
import io
from PIL import Image
from rembg import remove

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.webp'):
                filepath = os.path.join(root, file)
                print(f"Processing {filepath}...")
                
                try:
                    # Read image
                    with open(filepath, 'rb') as f:
                        input_data = f.read()
                    
                    # Remove background
                    output_data = remove(input_data)
                    
                    # Open the output image
                    img = Image.open(io.BytesIO(output_data))
                    
                    # Save it back as WEBP (lossless to preserve transparency)
                    img.save(filepath, 'WEBP', lossless=True)
                    print(f"Successfully processed {filepath}")
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")

if __name__ == "__main__":
    target_dir = os.path.abspath('public/assets/images/characters')
    print(f"Target directory: {target_dir}")
    process_directory(target_dir)
