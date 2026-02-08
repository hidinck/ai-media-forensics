import requests
import cv2
import numpy as np
from concurrent.futures import ThreadPoolExecutor, as_completed

from .metadata import extract_metadata
from .frequency import fft_score
from .patcher import patch_fft_map
from .noise import noise_score
from .ensemble import combine


MAX_WORKERS = 6


def analyze_one(img):

    url = img["url"]

    try:
        resp = requests.get(url, timeout=8)
        content = resp.content

        arr = np.frombuffer(content, np.uint8)
        image = cv2.imdecode(arr, cv2.IMREAD_COLOR)

        meta = extract_metadata(content)

        freq = fft_score(content)

        patch_map = patch_fft_map(image)
        patch_score = float(patch_map.mean())

        noise = noise_score(image)

        final = combine(freq, patch_score, noise, meta["suspicious"])

        return {
            "url": url,
            "finalProb": final,
            "components": {
                "frequency": round(freq, 3),
                "patch": round(patch_score, 3),
                "noise": round(noise, 3),
                "metadata": meta["suspicious"]
            }
        }

    except Exception as e:
        return { "url": url, "error": str(e) }


def analyze_batch(data):

    images = data.get("images", [])

    results = []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:

        futures = [pool.submit(analyze_one, img) for img in images]

        for f in as_completed(futures):
            results.append(f.result())

    return results
