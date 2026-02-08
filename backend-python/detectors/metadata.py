from PIL import Image
import io

SUSPICIOUS_KEYWORDS = [
    "stable diffusion",
    "midjourney",
    "dall",
    "openai",
    "sdxl",
    "comfyui"
]

def extract_metadata(binary):

    img = Image.open(io.BytesIO(binary))
    exif = img.getexif()

    meta = {}
    suspicious = False

    for tag, val in exif.items():
        name = str(tag).lower()
        meta[name] = str(val)

        for k in SUSPICIOUS_KEYWORDS:
            if k in str(val).lower():
                suspicious = True

    return {
        "raw": meta,
        "suspicious": suspicious
    }
