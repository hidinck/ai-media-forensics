import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function SignalsPanel({ signals }) {

  const data = Object.entries(signals).map(([k, v]) => ({
    name: k,
    value: Number(v)
  }));

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow">

      <h3 className="font-semibold mb-4">
        Signal Strength
      </h3>

      <div className="h-64">

        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis domain={[0, 1]} />
            <Tooltip />
            <Bar dataKey="value" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>

      </div>

    </div>
  );
}
