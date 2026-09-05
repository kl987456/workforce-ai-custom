import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mic, Users, Radio, Phone, Webhook, Database, Search, ArrowRight } from "lucide-react";
import { ThreeHero } from "../components/hero/ThreeHero";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

const STATS = [
  { label: "Match Accuracy", value: "98.4%" },
  { label: "Seeded Talent Pool", value: "1,000+" },
  { label: "First-Byte SLA", value: "<108ms" },
  { label: "Voice Personas", value: "6" },
];

const PILLARS = [
  {
    icon: Mic,
    tag: "Pillar 01",
    title: "Hunar Voice AI Hiring Assistant",
    body: "Create a requisition, add candidates, and let a real Hunar Voice AI agent conduct the first-round phone screen. Extracted answers — interest, compensation, notice period, recommendation — land on a live dashboard the moment the call ends.",
    href: "/hiring-assistant",
    cta: "Open Hiring Assistant",
  },
  {
    icon: Users,
    tag: "Pillar 02",
    title: "People Search & Autonomous Reachout",
    body: "Paste a job description, get a ranked shortlist from a 1,000-profile talent pool spanning ~50 IT/software role archetypes, and trigger a real Hunar voice outreach call — individually or in bulk.",
    href: "/talent-search",
    cta: "Open Talent Search",
  },
];

const INFRA = [
  { icon: Phone, title: "Real Hunar Voice AI", body: "Every call — hiring screen or reachout — is placed through Hunar's live /calls API with a purpose-built agent." },
  { icon: Webhook, title: "Signed webhooks", body: "call_status_updated, call_recording_done, call_result_done, call_summary — verified with HMAC-SHA256 before anything is written." },
  { icon: Database, title: "FastAPI + Postgres", body: "A from-scratch Python backend (FastAPI, asyncpg) persists agents, campaigns, candidates, calls, and a full webhook audit trail." },
  { icon: Search, title: "1,000-profile talent pool", body: "Provider-agnostic search adapter, seeded with realistic candidates across ~50 role archetypes — swap in a real people-search API with zero UI changes." },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <header className="sticky top-0 z-30 border-b border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container font-semibold text-on-primary">
              W
            </div>
            <span className="text-sm font-semibold tracking-tight">Workforce AI</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-on-surface-variant md:flex">
            <a href="#pillars" className="hover:text-on-surface">Product</a>
            <a href="#infra" className="hover:text-on-surface">Architecture</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/hiring-assistant"><Button variant="outline" size="sm">Hiring Assistant</Button></Link>
            <Link to="/talent-search"><Button size="sm">Talent Search</Button></Link>
          </div>
        </div>
      </header>

      <section className="relative min-h-[88vh] overflow-hidden">
        <ThreeHero />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-background/40 via-background/20 to-background" />
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pt-28 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-container-lowest/80 px-4 py-1.5 text-xs font-medium text-on-surface-variant backdrop-blur">
            Powered by Hunar Voice AI · Custom-built frontend & backend
          </span>
          <h1 className="mt-6 bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
            An Autonomous Voice Layer for Hiring &amp; Talent Sourcing
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-on-surface-variant">
            Two real, working products: an AI hiring assistant that phone-screens candidates, and
            a people-search &amp; reachout engine that sources from a 1,000-profile pool — both
            wired to real Hunar Voice AI calls, real webhooks, and a real database.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/hiring-assistant">
              <Button className="gap-2">
                Launch Hiring Assistant <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/talent-search">
              <Button variant="outline">Launch Talent Search</Button>
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 300, damping: 24 }}
                className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/70 px-4 py-3 text-left backdrop-blur"
              >
                <div className="text-xl font-semibold text-on-surface">{s.value}</div>
                <div className="text-[11px] text-on-surface-variant">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="pillars" className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            The Two Pillars
          </span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Voice AI, applied to two real workforce problems
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
            <Card tilt className="flex h-full flex-col gap-4 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-fixed text-on-primary-fixed">
                  <p.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-mono text-[11px] text-on-surface-variant">{p.tag}</div>
                  <h3 className="text-base font-semibold">{p.title}</h3>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-on-surface-variant">{p.body}</p>
              <Link to={p.href} className="mt-auto">
                <Button variant="secondary" className="w-full gap-2">
                  {p.cta} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="infra" className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-10 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            How it's actually wired
          </span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            No simulated calls, no fake data
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INFRA.map((n, i) => (
            <motion.div
              key={n.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex flex-col gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4"
            >
              <n.icon className="h-4 w-4 text-primary" />
              <div className="text-sm font-medium">{n.title}</div>
              <p className="text-xs leading-relaxed text-on-surface-variant">{n.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-outline-variant/30 py-8 text-center text-xs text-on-surface-variant">
        <span className="inline-flex items-center gap-1.5">
          <Radio className="h-3 w-3" /> Workforce AI — a custom-built frontend/backend for the
          Hunar Voice AI product exercise
        </span>
      </footer>
    </div>
  );
}
