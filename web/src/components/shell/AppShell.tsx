import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "../../lib/cn";

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  // "Console" labeling/grid texture stays for the Hiring Assistant identity,
  // but per explicit direction it keeps the light surface — no dark palette.
  const isConsole = pathname.startsWith("/hiring-assistant");

  return (
    <div className="min-h-screen bg-background text-on-surface transition-colors duration-300">
      <Sidebar isConsole={isConsole} />
      <div className="lg:pl-64">
        <Header />
        <main className={cn("px-4 py-6 lg:px-8 lg:py-8", isConsole && "bg-console-grid")}>{children}</main>
      </div>
    </div>
  );
}
