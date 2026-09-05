import { VOICE_PERSONAS } from "../../lib/personas";
import { cn } from "../../lib/cn";

export function PersonaPicker({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-on-surface-variant">Voice persona</span>
      <div className="flex flex-wrap gap-1.5">
        {VOICE_PERSONAS.map((p) => (
          <button
            key={p.code}
            type="button"
            title={p.blurb}
            onClick={() => onChange(p.code)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              value === p.code
                ? "border-primary-container bg-primary-container text-on-primary"
                : "border-outline-variant/50 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"
            )}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
