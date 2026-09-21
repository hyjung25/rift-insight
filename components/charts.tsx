"use client";
import { champions, perMinute } from "@/lib/metrics";
import type { Match } from "@/lib/types";
export function ChampionChart({ matches }: { matches: Match[] }) {
  const rows = champions(matches);
  return (
    <div
      className="bar-chart"
      role="img"
      aria-label={rows
        .map(
          (r) =>
            `${r.name}: ${Math.round(r.winRate)}% win rate, ${r.count} matches`,
        )
        .join("; ")}
    >
      {rows.map((row) => (
        <div className="bar-row" key={row.name}>
          <span>{row.name}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${row.winRate}%` }} />
          </div>
          <strong>{Math.round(row.winRate)}%</strong>
          <small>{row.count} games</small>
        </div>
      ))}
      <div className="bar-axis">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
}
export function FarmingChart({ matches }: { matches: Match[] }) {
  const rows = [...matches].sort((a, b) => a.startedAt - b.startedAt);
  const values = rows.map((m) => perMinute(m.cs, m.duration));
  const max = Math.max(10, Math.ceil(Math.max(...values, 0) / 2) * 2);
  const x = (i: number) => 42 + (i / Math.max(1, rows.length - 1)) * 536;
  const y = (value: number) => 160 - (value / max) * 134;
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  return (
    <div className="line-chart">
      <svg
        viewBox="0 0 610 196"
        role="img"
        aria-label={`CS per minute across ${rows.length} matches, oldest to newest. Exact values are available in match history.`}
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#53a9ee" stopOpacity=".22" />
            <stop offset="100%" stopColor="#53a9ee" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line
              x1="42"
              x2="578"
              y1={y(max * t)}
              y2={y(max * t)}
              stroke="#28313e"
              strokeDasharray="3 5"
            />
            <text x="15" y={y(max * t) + 4}>
              {max * t}
            </text>
          </g>
        ))}
        {rows.length > 1 && (
          <>
            <polygon
              points={`42,160 ${points} 578,160`}
              fill="url(#chart-fill)"
            />
            <polyline
              points={points}
              fill="none"
              stroke="#63b4ff"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </>
        )}
        {rows.map((m, i) => (
          <circle
            key={m.id}
            cx={x(i)}
            cy={y(values[i])}
            r="3.5"
            fill="#101925"
            stroke="#7ec5ff"
            strokeWidth="2"
          >
            <title>{`${m.champion} · ${values[i].toFixed(2)} CS/min · ${new Date(m.startedAt).toISOString().slice(0, 10)}`}</title>
          </circle>
        ))}
        <text x="42" y="188">
          Oldest match
        </text>
        <text x="578" y="188" textAnchor="end">
          Most recent
        </text>
      </svg>
    </div>
  );
}
