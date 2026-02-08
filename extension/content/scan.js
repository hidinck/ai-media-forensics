console.log("[AI] scan.js injected");

if (!window.__AI_FORENSICS_LOADED__) {
  window.__AI_FORENSICS_LOADED__ = true;

  console.log("[AI] scan.js fully loaded");

  window.scannedImages = [];
  window.__AI_BADGES__ = [];

  // =====================================
  // CLEAR OLD BADGES + HEATMAPS
  // =====================================
  function clearBadges() {
    window.__AI_BADGES__.forEach(b => b.remove());
    window.__AI_BADGES__ = [];

    window.scannedImages.forEach(img => {
      if (img.__heatmapOverlay) {
        img.__heatmapOverlay.remove();
        img.__heatmapOverlay = null;
      }
    });
  }

  // =====================================
  // COLLECT IMAGES
  // =====================================
  function collectImages() {
    clearBadges();

    const imgs = [...document.images].filter(
      img =>
        img.naturalWidth > 150 &&
        img.naturalHeight > 150 &&
        img.currentSrc &&
        img.offsetParent !== null
    );

    window.scannedImages = imgs;

    console.log("[AI] collected:", imgs.length);

    return imgs.map((img, index) => ({
      index,
      url: img.currentSrc,
      width: img.naturalWidth,
      height: img.naturalHeight
    }));
  }

  // =====================================
  // HEATMAP OVERLAY
  // =====================================
  async function attachHeatmap(img) {
    console.log("🔥 Heatmap overlay requested");

    try {
      const imgRes = await fetch(img.currentSrc);
      const blobImg = await imgRes.blob();

      const fd = new FormData();
      fd.append("img", blobImg, "image.jpg");

      const res = await fetch("http://localhost:5000/heatmap", {
        method: "POST",
        body: fd
      });

      if (!res.ok) {
        console.error("[AI] Heatmap HTTP error:", res.status);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // remove old
      if (img.__heatmapOverlay) {
        img.__heatmapOverlay.remove();
        img.__heatmapOverlay = null;
      }

      const overlay = document.createElement("img");
      overlay.src = url;

      overlay.style.position = "absolute";
      overlay.style.pointerEvents = "none";
      overlay.style.opacity = "0.65";
      overlay.style.zIndex = "2147483647";
      overlay.style.objectFit = "cover";
      overlay.style.mixBlendMode = "screen";

      document.body.appendChild(overlay);

      function sync() {
        if (!img.__heatmapOverlay) return;

        const r = img.getBoundingClientRect();

        overlay.style.left = r.left + window.scrollX + "px";
        overlay.style.top = r.top + window.scrollY + "px";
        overlay.style.width = r.width + "px";
        overlay.style.height = r.height + "px";

        requestAnimationFrame(sync);
      }

      img.__heatmapOverlay = overlay;
      sync();

      console.log("✅ Heatmap overlay attached");
    } catch (e) {
      console.error("[AI] Heatmap failed:", e);
    }
  }

  // =====================================
  // BADGE ATTACH
  // =====================================
  function attachBadge(img, result) {
    const rect = img.getBoundingClientRect();

    const badge = document.createElement("div");

    const p = Number(result?.probability ?? result?.finalProb ?? 0);

    badge.innerText = `AI ${(p * 100).toFixed(1)}%`;

    badge.style.position = "absolute";
    badge.style.left = rect.left + window.scrollX + "px";
    badge.style.top = rect.top + window.scrollY + "px";
    badge.style.background = "#ff0066";
    badge.style.color = "white";
    badge.style.fontSize = "12px";
    badge.style.fontWeight = "bold";
    badge.style.padding = "4px 8px";
    badge.style.borderRadius = "6px";
    badge.style.cursor = "pointer";
    badge.style.zIndex = "2147483647";
    badge.style.userSelect = "none";

    badge.addEventListener("mousedown", e => {
      e.preventDefault();
      e.stopPropagation();
    });

    badge.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();

      console.log("🟣 Badge clicked");

      if (img.__heatmapOverlay) {
        img.__heatmapOverlay.remove();
        img.__heatmapOverlay = null;
        console.log("❌ Heatmap removed");
      } else {
        attachHeatmap(img);
      }
    });

    document.body.appendChild(badge);
    window.__AI_BADGES__.push(badge);
  }

  // =====================================
  // MESSAGE HANDLER
  // =====================================
  chrome.runtime.onMessage.addListener((msg, sender, send) => {
    if (msg.type === "PING") {
      send({ ok: true });
      return true;
    }

    if (msg.type === "SCAN_PAGE") {
      const images = collectImages();
      send({ images });
      return true;
    }

    if (msg.type === "RENDER_RESULTS") {
      const results = msg.results?.results || msg.results || [];

      console.log("[AI] render:", results.length);

      results.forEach((r, i) => {
        const img = window.scannedImages[i];
        if (img) attachBadge(img, r);
      });

      return true;
    }
  });
}
