import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
          <motion.div
            className={`relative flex max-h-[85vh] w-full flex-col gap-4 overflow-y-auto rounded-2xl bg-surface-container-lowest p-6 shadow-xl ${
              wide ? "max-w-lg" : "max-w-md"
            }`}
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1 text-on-surface-variant hover:bg-surface-container"
            >
              <X className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-base font-semibold text-on-surface">{title}</h2>
              {description && (
                <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
              )}
            </div>
            <div className="flex flex-col gap-3">{children}</div>
            {footer && <div className="flex justify-end gap-2 pt-1">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
