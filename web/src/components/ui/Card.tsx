import type { HTMLAttributes } from "react";
import { motion, useMotionValue, useSpring, useTransform, type HTMLMotionProps } from "framer-motion";
import { cn } from "../../lib/cn";

const BASE = "rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm";

export function Card({ className, tilt, ...props }: HTMLAttributes<HTMLDivElement> & { tilt?: boolean }) {
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [7, -7]), { stiffness: 250, damping: 22 });
  const rotateY = useSpring(useTransform(px, [0, 1], [-7, 7]), { stiffness: 250, damping: 22 });

  if (!tilt) {
    return <div className={cn(BASE, className)} {...props} />;
  }

  return (
    <motion.div
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        px.set((e.clientX - rect.left) / rect.width);
        py.set((e.clientY - rect.top) / rect.height);
      }}
      onMouseLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className={cn(BASE, "will-change-transform", className)}
      {...(props as HTMLMotionProps<"div">)}
    />
  );
}
