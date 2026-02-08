from fastapi import FastAPI, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse

import numpy as np
import cv2
import time
import logging
from typing import Literal

from detectors.pipeline import analyze_batch

# =====================================================
# APP CONFIG
# =====================================================

ENGINE_VERSION = "1.4.0"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

log = logging.getLogger("forensics")

app = FastAPI(
    title="AI Media Forensics Inference Engine",
    version=ENGINE_VERSION
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# UTILITIES
# =====================================================

def decode_image(binary: bytes):

    arr = np.frombuffer(binary, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)

    if img is None:
        raise RuntimeError("OpenCV failed to decode image")

    return img


# =====================================================
# HEATMAP MODES
# =====================================================

def heatmap_freq(img: np.ndarray):

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    f = np.fft.fft2(gray)
    fshift = np.fft.fftshift(f)

    magnitude = np.log(np.abs(fshift) + 1)

    magnitude = cv2.normalize(magnitude, None, 0, 255, cv2.NORM_MINMAX)
    magnitude = magnitude.astype(np.uint8)

    heat = cv2.applyColorMap(magnitude, cv2.COLORMAP_JET)

    overlay = cv2.addWeighted(img, 0.25, heat, 0.85, 0)

    return overlay


def heatmap_patch(img: np.ndarray):

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    blur = cv2.GaussianBlur(gray, (0, 0), sigmaX=25)

    diff = cv2.absdiff(gray, blur)

    diff = cv2.normalize(diff, None, 0, 255, cv2.NORM_MINMAX)
    diff = diff.astype(np.uint8)

    heat = cv2.applyColorMap(diff, cv2.COLORMAP_HOT)

    overlay = cv2.addWeighted(img, 0.35, heat, 0.9, 0)

    return overlay


def heatmap_noise(img: np.ndarray):

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    kernel = np.array([
        [-1, -1, -1],
        [-1,  8, -1],
        [-1, -1, -1]
    ])

    noise = cv2.filter2D(gray, -1, kernel)

    noise = cv2.normalize(noise, None, 0, 255, cv2.NORM_MINMAX)
    noise = noise.astype(np.uint8)

    heat = cv2.applyColorMap(noise, cv2.COLORMAP_TURBO)

    overlay = cv2.addWeighted(img, 0.3, heat, 0.9, 0)

    return overlay


HEATMAP_DISPATCH = {
    "freq": heatmap_freq,
    "patch": heatmap_patch,
    "noise": heatmap_noise
}

# =====================================================
# HEALTH
# =====================================================

@app.get("/health")
def health():
    return {
        "status": "ok",
        "engine": ENGINE_VERSION
    }


# =====================================================
# ANALYSIS (BATCH FROM EXTENSION)
# =====================================================

@app.post("/analyze")
async def analyze(data: dict):

    start = time.time()

    results = analyze_batch(data)

    elapsed = round(time.time() - start, 3)

    return {
        "elapsed": elapsed,
        "count": len(results),
        "results": results
    }


# =====================================================
# HEATMAP ENDPOINT
# =====================================================

@app.post("/heatmap")
async def heatmap(
    img: UploadFile = File(...),
    mode: Literal["freq", "patch", "noise"] = Query("freq")
):

    t0 = time.time()

    log.info(f"/heatmap called | mode={mode}")

    try:
        binary = await img.read()

        decoded = decode_image(binary)

        fn = HEATMAP_DISPATCH[mode]

        overlay = fn(decoded)

        ok, buf = cv2.imencode(".png", overlay)

        if not ok:
            raise RuntimeError("PNG encoding failed")

        runtime = round((time.time() - t0) * 1000)

        h, w, _ = decoded.shape

        return Response(
            content=buf.tobytes(),
            media_type="image/png",
            headers={
                "Cache-Control": "no-store",
                "x-heatmap-mode": mode,
                "x-runtime-ms": str(runtime),
                "x-image-shape": f"{w}x{h}",
                "x-engine-version": ENGINE_VERSION,
            }
        )

    except Exception as e:

        log.exception("Heatmap failure")

        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


# =====================================================
# 🔥 SINGLE IMAGE FORENSIC ANALYSIS
# =====================================================

@app.post("/analyze-image")
async def analyze_image(img: UploadFile = File(...)):

    t0 = time.time()

    log.info("/analyze-image called")

    try:
        binary = await img.read()

        decoded = decode_image(binary)

        # -----------------------------
        # DETECTOR SIGNALS
        # -----------------------------

        gray = cv2.cvtColor(decoded, cv2.COLOR_BGR2GRAY)

        # Frequency score
        f = np.fft.fft2(gray)
        fshift = np.fft.fftshift(f)
        mag = np.log(np.abs(fshift) + 1)
        freq_score = float(np.clip(np.mean(mag[mag > np.percentile(mag, 98)]) / 10, 0, 1))

        # Noise score
        kernel = np.array([
            [-1, -1, -1],
            [-1,  8, -1],
            [-1, -1, -1]
        ])
        noise = cv2.filter2D(gray, -1, kernel)
        noise_score = float(np.clip(np.var(noise) / 5000, 0, 1))

        # Patch score
        blur = cv2.GaussianBlur(gray, (0, 0), sigmaX=25)
        diff = cv2.absdiff(gray, blur)
        patch_score = float(np.clip(np.mean(diff) / 40, 0, 1))

        signals = {
            "frequency": round(freq_score, 3),
            "noise": round(noise_score, 3),
            "patch": round(patch_score, 3),
        }

        # -----------------------------
        # ENSEMBLE FUSION
        # -----------------------------

        final = round(
            min(
                1.0,
                0.35 * freq_score +
                0.30 * noise_score +
                0.35 * patch_score
            ),
            3
        )

        if final > 0.75:
            risk = "HIGH"
        elif final > 0.45:
            risk = "MEDIUM"
        else:
            risk = "LOW"

        explanations = []

        if freq_score > 0.6:
            explanations.append("High spectral energy anomalies detected")

        if patch_score > 0.6:
            explanations.append("Patch-level texture inconsistency")

        if noise_score > 0.6:
            explanations.append("Noise residual irregularities")

        runtime = round((time.time() - t0) * 1000)

        return {
            "final_score": final,
            "risk": risk,
            "signals": signals,
            "explanations": explanations,
            "runtime_ms": runtime,
            "engine_version": ENGINE_VERSION
        }

    except Exception as e:

        log.exception("Analyze-image failure")

        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )
