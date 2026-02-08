import { PieChart, Pie, Cell } from "recharts";

export default function RiskGauge({ score }) {

  const pct = Math.round(score * 100);

  const data = [
    { name: "risk", value: pct },
    { name: "safe", value: 100 - pct }
  ];

  const color =
    pct > 70 ? "#ef4444" :
    pct > 40 ? "#f59e0b" :
    "#22c55e";

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow">

      <h3 className="font-semibold mb-4">Final Risk Score</h3>

      <div className="flex justify-center">

        <PieChart width={220} height={220}>
          <Pie
            data={data}
            startAngle={90}
            endAngle={-270}
            innerRadius={70}
            outerRadius={95}
            dataKey="value"
          >
            <Cell fill={color} />
            <Cell fill="#e5e7eb" />
          </Pie>
        </PieChart>

      </div>

      <p className="text-center text-3xl font-bold mt-2">
        {pct}%
      </p>

    </div>
  );
}
