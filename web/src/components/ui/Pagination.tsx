import { cn } from "../../lib/cn";

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "…")[] = [];
  const window = 1;
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= window) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="h-8 rounded-lg border border-outline-variant/50 px-2.5 text-xs font-medium text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
      >
        Prev
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-xs text-on-surface-variant">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn(
              "h-8 w-8 rounded-lg text-xs font-medium",
              p === page ? "bg-primary-container text-on-primary" : "text-on-surface-variant hover:bg-surface-container"
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        className="h-8 rounded-lg border border-outline-variant/50 px-2.5 text-xs font-medium text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
