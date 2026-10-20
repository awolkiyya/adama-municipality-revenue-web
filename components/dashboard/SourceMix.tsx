"use client";

type SourceMixProps = {
  assessmentTotal: number;
  directTotal: number;
};

const SOURCES = [
  { key: "assessment", label: "Assessment-based", color: "bg-chart-1" },
  { key: "direct", label: "Direct collection", color: "bg-chart-2" },
] as const;

export default function SourceMix({
  assessmentTotal,
  directTotal,
}: SourceMixProps) {
  const values = {
    assessment: Math.max(0, assessmentTotal),
    direct: Math.max(0, directTotal),
  };
  const total = values.assessment + values.direct;

  const sources = SOURCES.map((s) => ({
    ...s,
    share: total > 0 ? (values[s.key] / total) * 100 : 0,
  }));

  return (
    <div className="space-y-3">
      <div
        role="img"
        aria-label={
          total > 0
            ? sources.map((s) => `${s.label} ${s.share.toFixed(0)}%`).join(", ")
            : "No collections recorded"
        }
        className="flex h-2 overflow-hidden rounded-full bg-muted"
      >
        {sources.map((s) => (
          <div
            key={s.key}
            className={`${s.color} transition-[width] duration-300`}
            style={{ width: `${s.share}%` }}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm">
        {sources.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span className={`size-2 shrink-0 rounded-full ${s.color}`} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="font-medium tabular-nums">
              {s.share.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}