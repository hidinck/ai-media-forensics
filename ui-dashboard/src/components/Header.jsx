export default function Header() {
  return (
    <header className="border-b border-slate-200 dark:border-zinc-800">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">

        <h1 className="text-2xl font-bold tracking-tight">
          🕵️ AI Media Forensics
        </h1>

        <span className="text-xs px-3 py-1 rounded-full bg-indigo-600 text-white">
          Engine v1.4.0
        </span>

      </div>
    </header>
  );
}
