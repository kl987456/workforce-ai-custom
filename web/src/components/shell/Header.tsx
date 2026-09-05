import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { cn } from "../../lib/cn";

export function Header() {
  const [status, setStatus] = useState<"checking" | "connected" | "unreachable">("checking");

  useEffect(() => {
    let cancelled = false;
    api
      .health()
      .then((d) => !cancelled && setStatus(d.hunar === "connected" ? "connected" : "unreachable"))
      .catch(() => !cancelled && setStatus("unreachable"));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-outline-variant/30 bg-surface-container-lowest/90 px-4 backdrop-blur-md lg:px-6">
      <div className="hidden items-center gap-2 text-sm text-on-surface-variant lg:flex">
        <span className="rounded-lg border border-outline-variant/40 bg-surface-container px-2 py-0.5 font-mono text-xs">
          Custom Build
        </span>
        <span className="rounded-lg border border-outline-variant/40 bg-surface-container px-2 py-0.5 font-mono text-xs">
          FastAPI · Python
        </span>
        <span className="rounded-lg border border-outline-variant/40 bg-surface-container px-2 py-0.5 font-mono text-xs">
          React · Vite
        </span>
      </div>
      <span
        className={cn(
          "ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
          status === "connected" && "border-tertiary/30 bg-tertiary-fixed text-on-tertiary-fixed",
          status === "unreachable" && "border-error/30 bg-error-container text-on-error-container",
          status === "checking" && "border-outline-variant/40 bg-surface-container text-on-surface-variant"
        )}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            status === "connected" && "animate-pulse bg-tertiary",
            status === "unreachable" && "bg-error",
            status === "checking" && "bg-on-surface-variant"
          )}
        />
        {status === "connected" && "Hunar Voice API connected"}
        {status === "unreachable" && "Hunar Voice API unreachable"}
        {status === "checking" && "Checking Hunar API…"}
      </span>
    </header>
  );
}
