import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Mic, Users, Radar } from "lucide-react";
import { cn } from "../../lib/cn";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/hiring-assistant", label: "Hunar Voice AI Assistant", icon: Mic },
  { to: "/talent-search", label: "People Search & Reachout", icon: Users },
];

export function Sidebar({ isConsole = false }: { isConsole?: boolean }) {
  return (
    <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col justify-between border-r border-outline-variant/40 bg-surface-container-lowest lg:flex">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-outline-variant/30 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container font-semibold text-on-primary">
            W
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight text-on-surface">
              Workforce AI
            </span>
            <span className="mt-0.5 font-mono text-[11px] text-on-surface-variant">
              {isConsole ? "voice ops console" : "v1.0 · custom build"}
            </span>
          </div>
        </div>

        <div className="px-4 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
          {isConsole ? "Live Dial Console" : "Operating System"}
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 rounded-xl bg-primary-container shadow-sm"
                      transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    />
                  )}
                  <item.icon className="relative z-10 h-[18px] w-[18px] shrink-0" />
                  <span className="relative z-10">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="border-t border-outline-variant/30 p-3">
        <div className="flex flex-col gap-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-low p-2.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-on-surface">
              <span className="h-2 w-2 animate-pulse rounded-full bg-tertiary" />
              {isConsole ? "Voice trunk secure" : "Cluster TLS 1.3"}
            </span>
            <span className="font-mono text-xs font-semibold text-tertiary">99.98%</span>
          </div>
          <div className="flex items-center justify-between font-mono text-[11px] text-on-surface-variant">
            <span className="flex items-center gap-1">
              <Radar className="h-3 w-3" /> Latency SLA
            </span>
            <span className="font-medium text-on-surface">&lt; 84ms</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
