import { useRef } from "react";

export default function UploadBox({ onSelect, onAnalyze }) {

  const fileInput = useRef();

  return (
    <div className="border-2 border-dashed rounded-xl p-10 text-center bg-white dark:bg-zinc-900">

      <h2 className="text-xl font-semibold mb-2">
        Upload Image for Analysis
      </h2>

      <p className="text-sm opacity-70 mb-6">
        JPG / PNG • Heatmaps • Frequency & Noise Signals
      </p>

      <input
        type="file"
        accept="image/*"
        hidden
        ref={fileInput}
        onChange={e => {
          const f = e.target.files[0];
          if (f) onAnalyze(f);
        }}
      />

      <button
        onClick={() => fileInput.current.click()}
        className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
      >
        Select Image
      </button>

    </div>
  );
}
