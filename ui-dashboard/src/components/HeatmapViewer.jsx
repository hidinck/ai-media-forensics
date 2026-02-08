import { useEffect, useRef, useState } from "react";
import axios from "axios";

export default function HeatmapViewer({ file }) {
  const [mode, setMode] = useState("freq");
  const [heatmapUrl, setHeatmapUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const [slider, setSlider] = useState(50);

  const originalUrl = file ? URL.createObjectURL(file) : null;

  async function fetchHeatmap(selectedMode) {
    if (!file) return;

    setLoading(true);

    const form = new FormData();
    form.append("img", file);

    const API = import.meta.env.VITE_API_BASE;

    const res = await axios.post(
        `${API}/heatmap?mode=${selectedMode}`,
        form,
        { responseType: "blob" }
    );


    setHeatmapUrl(URL.createObjectURL(res.data));
    setLoading(false);
  }

  useEffect(() => {
    if (file) fetchHeatmap(mode);
  }, [file, mode]);

  if (!file) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6 mt-6">
      <h2 className="text-lg font-semibold mb-3">🔥 Forensic Heatmap</h2>

      {/* MODE BUTTONS */}
      <div className="flex gap-2 mb-4">
        {["freq", "patch", "noise"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1 rounded-full text-sm font-medium transition
              ${
                mode === m
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 dark:bg-zinc-700"
              }`}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      {/* COMPARE SLIDER */}
      <div className="relative w-full max-w-3xl mx-auto">

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 rounded-lg">
            <span className="text-white animate-pulse">
              Generating heatmap…
            </span>
          </div>
        )}

        <div className="relative overflow-hidden rounded-lg border">

          {/* ORIGINAL */}
          <img
            src={originalUrl}
            className="w-full block"
            alt="original"
          />

          {/* HEATMAP OVERLAY */}
          {heatmapUrl && (
            <img
              src={heatmapUrl}
              alt="heatmap"
              className="absolute top-0 left-0 h-full object-cover"
              style={{
                width: `${slider}%`,
                clipPath: `inset(0 ${100 - slider}% 0 0)`
              }}
            />
          )}

          {/* SLIDER LINE */}
          <div
            className="absolute top-0 bottom-0 w-[3px] bg-white shadow z-10"
            style={{ left: `${slider}%` }}
          />

          {/* RANGE INPUT */}
          <input
            type="range"
            min="1"
            max="99"
            value={slider}
            onChange={(e) => setSlider(e.target.value)}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[80%] z-20 accent-indigo-600"
          />
        </div>

        {/* LABELS */}
        <div className="flex justify-between text-xs mt-2 opacity-70">
          <span>Original</span>
          <span>Heatmap</span>
        </div>
      </div>
    </div>
  );
}
