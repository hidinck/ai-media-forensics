import { CheckCircle, Loader2, Image, Activity, Flame, FileDown } from "lucide-react";

export default function ForensicTimeline({ stage }) {

  const steps = [
    { id: "upload", label: "Image Uploaded", icon: Image },
    { id: "signals", label: "Signals Extracted", icon: Activity },
    { id: "risk", label: "Risk Scored", icon: CheckCircle },
    { id: "heatmap", label: "Heatmaps Generated", icon: Flame },
    { id: "report", label: "Report Ready", icon: FileDown }
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6">

      <h3 className="font-bold text-lg mb-4">🕵️ Forensic Pipeline Timeline</h3>

      <div className="flex items-center justify-between">

        {steps.map((s, idx) => {

          const active =
            steps.findIndex(x => x.id === stage) >= idx;

          const Icon = s.icon;

          return (
            <div key={s.id} className="flex flex-col items-center flex-1">

              <div
                className={`rounded-full p-3 transition-all duration-300
                  ${active
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-slate-200 dark:bg-zinc-700 text-slate-500"
                  }`}
              >
                {active ? <Icon size={20} /> : <Loader2 size={18} />}
              </div>

              <p className="text-xs mt-2 text-center">{s.label}</p>

              {idx !== steps.length - 1 && (
                <div
                  className={`h-1 w-full mt-4 rounded
                    ${active ? "bg-indigo-500" : "bg-slate-200 dark:bg-zinc-700"}
                  `}
                />
              )}
            </div>
          );
        })}

      </div>
    </div>
  );
}
