import Header from "./components/Header";
import UploadBox from "./components/UploadBox";
import RiskGauge from "./components/RiskGauge";
import SignalsPanel from "./components/SignalsPanel";
import Explainability from "./components/Explainability";
import HeatmapViewer from "./components/HeatmapViewer";
import ExportReport from "./components/ExportReport";
import ForensicTimeline from "./components/ForensicTimeline";
import CaseHistory from "./components/CaseHistory";

import { useState, useEffect } from "react";
import axios from "axios";

export default function App() {

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("upload");

  const [history, setHistory] = useState([]);

  // load saved cases
  useEffect(() => {
    const saved = localStorage.getItem("forensic-history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // persist
  useEffect(() => {
    localStorage.setItem("forensic-history", JSON.stringify(history));
  }, [history]);

  async function analyze(file) {

    setStage("upload");
    setLoading(true);

    const form = new FormData();
    form.append("img", file);

    const res = await axios.post(
      "http://127.0.0.1:8000/analyze-image",
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    setStage("signals");

    const record = {
      ...res.data,
      file,
      time: Date.now()
    };

    setResult({ ...res.data, __file: file });

    setStage("heatmap");

    setHistory(prev => [record, ...prev]);

    setLoading(false);
  }

  function openCase(c) {
    setResult({ ...c, __file: c.file });
  }

  function deleteCase(index) {
    setHistory(prev => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-black text-slate-900 dark:text-white">

      <Header />

      <main className="max-w-6xl mx-auto p-6 space-y-8">

        <UploadBox onAnalyze={analyze} />

        {loading && (
          <p className="text-center font-semibold animate-pulse">
            🔍 Analyzing image...
          </p>
        )}

        {result && <ForensicTimeline stage={stage} />}

        {/* ===== EXPORT BUTTON ===== */}
        {result && (
          <div className="flex justify-end">
            <ExportReport enabled />
          </div>
        )}

        {/* ===== REPORT ROOT ===== */}
        {result && (
          <div id="report-root" className="space-y-8">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              <RiskGauge score={result.final_score} />

              <SignalsPanel signals={result.signals} />

              <Explainability items={result.explanations} />

            </div>

            <HeatmapViewer file={result.__file} />

          </div>
        )}

        {/* ===== HISTORY PANEL ===== */}
        <CaseHistory
          cases={history}
          onOpen={openCase}
          onDelete={deleteCase}
        />

      </main>

    </div>
  );
}
