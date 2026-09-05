import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import type { Campaign } from "../../lib/types";
import { cn } from "../../lib/cn";
import { useToast } from "../ui/Toast";

export function RequisitionSwitcher({
  kind,
  activeId,
  onSelect,
  onNew,
  onDeleted,
  refreshToken,
}: {
  kind: "HIRING" | "TALENT_SEARCH";
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDeleted?: (id: string) => void;
  refreshToken: number;
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    api.listCampaigns(kind).then((d) => setCampaigns(d.campaigns));
  }, [kind, refreshToken]);

  async function handleDelete(id: string, title: string) {
    try {
      await api.deleteCampaign(id);
      toast.success(`"${title}" deleted`);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      onDeleted?.(id);
    } catch (e) {
      toast.error("Could not delete", e instanceof Error ? e.message : undefined);
    } finally {
      setConfirmId(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
      {campaigns.map((c) => (
        <div key={c.id} className="group relative">
          <button
            onClick={() => onSelect(c.id)}
            className={cn(
              "relative flex h-9 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors",
              c.id === activeId
                ? "border-transparent text-on-primary"
                : "border-outline-variant/50 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"
            )}
          >
            {c.id === activeId && (
              <motion.span
                layoutId="requisition-active-pill"
                className="absolute inset-0 rounded-full bg-primary-container"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative z-10">{c.title}</span>
          </button>
          {confirmId === c.id ? (
            <div className="absolute left-1/2 top-10 z-10 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-1 shadow-lg">
              <button onClick={() => handleDelete(c.id, c.title)} className="rounded-md bg-error px-2 py-1 text-[10px] font-semibold text-on-error">
                Delete
              </button>
              <button onClick={() => setConfirmId(null)} className="rounded-md px-2 py-1 text-[10px] text-on-surface-variant hover:bg-surface-container">
                Cancel
              </button>
            </div>
          ) : (
            <button
              aria-label={`Delete ${c.title}`}
              onClick={(e) => {
                e.stopPropagation();
                setConfirmId(c.id);
              }}
              className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-error text-on-error group-hover:flex"
            >
              <Trash2 className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={onNew}
        className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-dashed border-outline-variant/60 px-4 text-sm font-medium text-on-surface-variant hover:bg-surface-container"
      >
        <Plus className="h-3.5 w-3.5" /> New
      </button>
    </div>
  );
}
