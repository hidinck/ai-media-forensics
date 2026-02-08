export default function Explainability({ items }) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow">

      <h3 className="font-semibold mb-3">
        Model Explanation
      </h3>

      <ul className="list-disc pl-5 space-y-2 text-sm opacity-80">
        {items.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>

    </div>
  );
}
