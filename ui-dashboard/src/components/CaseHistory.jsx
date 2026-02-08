export default function CaseHistory({ cases, onOpen, onDelete }) {
  if (!cases.length) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow p-6">

      <h2 className="text-xl font-bold mb-4">📂 Case History</h2>

      <div className="space-y-3">

        {cases.map((c, i) => (
          <div
            key={i}
            className="flex items-center justify-between border rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >

            <div className="flex items-center gap-4">

              <img
                src={URL.createObjectURL(c.file)}
                alt="thumb"
                className="w-16 h-16 object-cover rounded"
              />

              <div>
                <p className="font-semibold">
                  Risk: {(c.final_score * 100).toFixed(1)}%
                </p>

                <p className="text-sm text-slate-500">
                  {new Date(c.time).toLocaleString()}
                </p>
              </div>

            </div>

            <div className="flex gap-2">

              <button
                onClick={() => onOpen(c)}
                className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Open
              </button>

              <button
                onClick={() => onDelete(i)}
                className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}
