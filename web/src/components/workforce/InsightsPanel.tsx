import type { LucideIcon } from "lucide-react";
import { Card } from "../ui/Card";

export interface Insight {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
}

export function InsightsPanel({ title, insights }: { title: string; insights: Insight[] }) {
  return (
    <Card className="flex flex-col gap-1">
      <h3 className="mb-1 text-sm font-semibold">{title}</h3>
      {insights.map((s, i) => (
        <div
          key={s.label}
          className={`flex items-center justify-between gap-3 py-2.5 ${i !== insights.length - 1 ? "border-b border-outline-variant/20" : ""}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-primary">
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs text-on-surface-variant">{s.label}</div>
              {s.hint && <div className="text-[10px] text-on-surface-variant/70">{s.hint}</div>}
            </div>
          </div>
          <span className="text-lg font-semibold">{s.value}</span>
        </div>
      ))}
    </Card>
  );
}
