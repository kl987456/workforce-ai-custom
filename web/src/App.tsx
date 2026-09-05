import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { ToastProvider } from "./components/ui/Toast";
import { AppShell } from "./components/shell/AppShell";
import { Landing } from "./pages/Landing";
import { HiringAssistant } from "./pages/HiringAssistant";
import { TalentSearch } from "./pages/TalentSearch";

function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
        <Route
          path="/hiring-assistant"
          element={
            <PageTransition>
              <AppShell>
                <HiringAssistant />
              </AppShell>
            </PageTransition>
          }
        />
        <Route
          path="/talent-search"
          element={
            <PageTransition>
              <AppShell>
                <TalentSearch />
              </AppShell>
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </ToastProvider>
  );
}
