import express from "express";
import cors from "cors";
import axios from "axios";
import FormData from "form-data";

const app = express();

// ============================
// Middleware
// ============================
app.use(cors());
app.use(express.json({ limit: "30mb" }));

// ============================
// Config
// ============================
const PYTHON_ANALYZE_URL = "http://127.0.0.1:5000/analyze";
const PYTHON_HEATMAP_URL = "http://127.0.0.1:5000/heatmap";

// ============================
// Health Check
// ============================
app.get("/", (req, res) => {
  res.json({
    status: "AI Media Forensics Node API running",
    pythonAnalyze: PYTHON_ANALYZE_URL,
    pythonHeatmap: PYTHON_HEATMAP_URL
  });
});

// =======================================================
// 🔥 HYBRID ROUTER
// Browser CNN → Python fallback
// =======================================================
app.post("/analyze", async (req, res) => {
  console.log("\n📥 Hybrid analyze request");

  const images = req.body.images || [];

  console.log("🖼 Images:", images.length);

  // ---------------------------
  // Split by browser confidence
  // ---------------------------
  const lowConfidence = images.filter(
    img =>
      typeof img.localProb === "number" &&
      img.localProb < 0.4
  );

  const highConfidence = images.filter(
    img =>
      typeof img.localProb === "number" &&
      img.localProb >= 0.4
  );

  console.log(
    `⚖ Escalating ${lowConfidence.length}, browser-confident ${highConfidence.length}`
  );

  let pythonResults = [];

  // ---------------------------
  // Call Python only if needed
  // ---------------------------
  if (lowConfidence.length > 0) {
    try {
      const py = await axios.post(
        PYTHON_ANALYZE_URL,
        { images: lowConfidence },
        { timeout: 120000 }
      );

      pythonResults = py.data.results || py.data;

      console.log("✅ Python escalation complete");
    } catch (err) {
      console.error("❌ Python escalation failed:", err.message);

      return res.status(500).json({
        error: "Python inference service unavailable",
        detail: err.message
      });
    }
  }

  // ---------------------------
  // Merge results
  // ---------------------------
  const merged = [
    ...highConfidence.map(img => ({
      ...img,
      finalProb: img.localProb,
      source: "browser"
    })),
    ...pythonResults.map(r => ({
      ...r,
      source: "python"
    }))
  ];

  res.json({
    count: merged.length,
    results: merged
  });
});

// =======================================================
// BACKWARD COMPAT / DIRECT PYTHON PIPELINE
// =======================================================
app.post("/detect", async (req, res) => {
  console.log("\n📥 Direct detect request");

  if (req.body?.images) {
    console.log("🖼 Images:", req.body.images.length);
  }

  try {
    const pyResponse = await axios.post(
      PYTHON_ANALYZE_URL,
      req.body,
      {
        timeout: 120000
      }
    );

    console.log("✅ Python inference finished");

    res.json(pyResponse.data);

  } catch (err) {
    console.error("❌ Python service error:", err.message);

    if (err.response) {
      console.error(err.response.data);
    }

    res.status(500).json({
      error: "Python inference service unavailable",
      detail: err.message
    });
  }
});

// ======================================
// 🔥 DEBUG HEATMAP PROXY ENDPOINT
// ======================================
app.post("/heatmap", async (req, res) => {

  console.log("\n🌡 Heatmap request");

  try {
    const { imageUrl } = req.body;

    console.log("🖼 URL:", imageUrl);

    if (!imageUrl) {
      return res.status(400).json({ error: "Missing imageUrl" });
    }

    console.log("⬇ Downloading image...");

    const imgResp = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 20000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept": "image/*,*/*",
        "Referer": imageUrl
      }
    });

    console.log("✅ Downloaded image bytes:", imgResp.data.length);

    const form = new FormData();

    form.append("img", Buffer.from(imgResp.data), {
      filename: "image.jpg",
      contentType: "image/jpeg"
    });

    console.log("📤 Sending to Python /heatmap...");

    const py = await axios.post(
      PYTHON_HEATMAP_URL,
      form,
      {
        headers: form.getHeaders(),
        timeout: 120000
      }
    );

    console.log("🔥 Python heatmap returned");

    res.set("Content-Type", "image/png");
    res.send(py.data);

  } catch (err) {

    console.error("❌ Heatmap failed");

    if (err.response) {
      console.error("STATUS:", err.response.status);
      console.error(
        "DATA:",
        typeof err.response.data === "string"
          ? err.response.data.slice(0, 200)
          : Buffer.isBuffer(err.response.data)
            ? err.response.data.toString("utf8", 0, 200)
            : err.response.data
      );
    } else {
      console.error(err.message);
    }

    res.status(500).json({
      error: "Heatmap failed",
      detail: err.message
    });
  }
});


// ============================
// Server Start
// ============================
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🚀 Node API running at http://localhost:${PORT}`);
});
