import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Loader2, Search, Target, PhoneCall, PhoneOutgoing, PhoneForwarded,
  Database, Radio, Sparkles,
} from "lucide-react";
import { staggerContainer, staggerItem } from "../lib/motion";
import { RequisitionSwitcher } from "../components/workforce/RequisitionSwitcher";
import { SkillGraph } from "../components/workforce/SkillGraph";
import { PersonaPicker } from "../components/workforce/PersonaPicker";
import { CandidateCard } from "../components/workforce/CandidateCard";
import { ConversationFeed } from "../components/workforce/ConversationFeed";
import { InsightsPanel } from "../components/workforce/InsightsPanel";
import { Pagination } from "../components/ui/Pagination";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useToast } from "../components/ui/Toast";
import { api } from "../lib/api";
import { useCampaignWorkspace } from "../lib/useCampaignWorkspace";

const PAGE_SIZE = 10;

function QueryBar({ onSearched }: { onSearched: (id: string) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [voicePersona, setVoicePersona] = useState("ROY");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function handleSearch() {
    if (!description || description.length < 10) {
      toast.error("Paste a fuller job description to search against");
      return;
    }
    setLoading(true);
    try {
      const finalTitle = title || description.slice(0, 60);
      const data = await api.createCampaign({ kind: "TALENT_SEARCH", title: finalTitle, jobDescription: description, voicePersona });
      toast.success(`Found ${data.candidates.length} matching candidates`);
      setTitle("");
      setDescription("");
      onSearched(data.campaign.id);
    } catch (e) {
      toast.error("Could not run search", e instanceof Error ? e.message : undefined);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
        <Sparkles className="h-3.5 w-3.5" /> Query Construction Engine
      </div>
      <input
        className="h-10 rounded-xl border border-outline-variant/50 px-3 text-sm"
        placeholder="Search title (optional — e.g. Senior ML Infra sourcing sweep)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <textarea
          className="min-h-[52px] flex-1 rounded-xl border border-outline-variant/50 p-3 font-mono text-sm"
          placeholder="Paste the full job description — skills, seniority, and years mentioned here drive the match ranking against the seeded talent pool."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button onClick={handleSearch} disabled={loading} className="h-auto gap-1.5 self-stretch px-6">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Execute Talent Graph Sweep
        </Button>
      </div>
      <PersonaPicker value={voicePersona} onChange={setVoicePersona} />
    </Card>
  );
}

export function TalentSearch() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDialing, setBulkDialing] = useState(false);
  const toast = useToast();
  const { campaign, candidates, calls, loading, refresh } = useCampaignWorkspace(activeId);

  function bump() {
    setRefreshToken((t) => t + 1);
    refresh();
  }

  const totalPages = Math.max(1, Math.ceil(candidates.length / PAGE_SIZE));
  const pageCandidates = useMemo(
    () => candidates.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [candidates, page]
  );

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkDial() {
    if (!campaign || selected.size === 0) return;
    setBulkDialing(true);
    try {
      const result = await api.createBulkCalls({ candidateIds: Array.from(selected), purpose: "TALENT_REACHOUT", campaignId: campaign.id });
      toast.success(`${result.placed.length} calls placed`, result.errors.length ? `${result.errors.length} failed` : undefined);
      setSelected(new Set());
      bump();
    } catch (e) {
      toast.error("Bulk dial failed", e instanceof Error ? e.message : undefined);
    } finally {
      setBulkDialing(false);
    }
  }

  function exportCsv() {
    const header = ["Name", "Role", "Company", "Location", "Years", "Match %", "Phone", "Email", "Skills"];
    const rows = candidates.map((c) => [c.name, c.role_title ?? "", c.company ?? "", c.location ?? "", String(c.years_experience ?? ""), String(c.match_score ?? ""), c.phone, c.email ?? "", c.skills.join("; ")]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${campaign?.title ?? "candidates"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const completedCalls = calls.filter((c) => c.status === "COMPLETED");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">People Search & Reachout</h1>
      </div>

      <Card className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-primary">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-medium">Talent Data Fabric</div>
            <div className="text-xs text-on-surface-variant">The one real, live source behind this search</div>
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-lg bg-surface-container-low px-3 py-1.5 font-mono text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-tertiary" /> Seeded Demo Talent Pool · 1,005 profiles
        </span>
      </Card>

      <QueryBar onSearched={(id) => { bump(); setActiveId(id); setPage(1); setSelected(new Set()); }} />

      <RequisitionSwitcher
        kind="TALENT_SEARCH"
        activeId={activeId}
        onSelect={(id) => { setActiveId(id); setPage(1); setSelected(new Set()); }}
        onNew={() => {}}
        onDeleted={(id) => { if (id === activeId) setActiveId(null); }}
        refreshToken={refreshToken}
      />

      {activeId && loading && <div className="h-64 animate-pulse rounded-2xl bg-surface-container-low" />}

      {activeId && campaign && !loading && candidates.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" /> Match Graph
            </h2>
            {campaign.persona_name && (
              <span className="flex items-center gap-1 rounded-full bg-primary-fixed px-2 py-0.5 text-[10px] font-semibold text-on-primary-fixed">
                <Radio className="h-2.5 w-2.5" /> Reachout voice: {campaign.persona_name}
              </span>
            )}
          </div>
          <SkillGraph candidates={candidates} selected={selected} onToggleSelect={toggleSelect} />
        </div>
      )}

      {activeId && campaign && !loading && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">
                Candidate Telemetry Feed <span className="font-mono text-primary">· {candidates.length} matches</span>
              </h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={exportCsv}>Export CSV</Button>
                <Button size="sm" className="gap-1.5" disabled={selected.size === 0 || bulkDialing} onClick={handleBulkDial}>
                  {bulkDialing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PhoneForwarded className="h-3.5 w-3.5" />}
                  Batch Dial ({selected.size})
                </Button>
              </div>
            </div>

            {candidates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-outline-variant/50 p-8 text-center text-sm text-on-surface-variant">
                No matches found — try broadening the description.
              </div>
            ) : (
              <>
                <motion.div
                  key={page}
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="flex flex-col gap-3"
                >
                  {pageCandidates.map((c) => (
                    <motion.div key={c.id} variants={staggerItem}>
                      <CandidateCard
                        candidate={c}
                        campaignId={campaign.id}
                        purpose="TALENT_REACHOUT"
                        onCallCreated={bump}
                        selectable
                        selected={selected.has(c.id)}
                        onToggleSelect={toggleSelect}
                      />
                    </motion.div>
                  ))}
                </motion.div>
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, candidates.length)} of {candidates.length}</span>
                  <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-4 lg:col-span-5">
            <InsightsPanel
              title="Hunar Voice Dispatcher"
              insights={[
                { label: "Candidates matched", value: String(candidates.length), icon: Users },
                { label: "Avg match score", value: candidates.length ? `${Math.round(candidates.reduce((s, c) => s + (c.match_score ?? 0), 0) / candidates.length)}%` : "—", icon: Target },
                { label: "Reachout calls placed", value: String(calls.length), icon: PhoneOutgoing },
                { label: "Calls completed", value: String(completedCalls.length), icon: PhoneCall },
              ]}
            />

            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <Radio className="h-4 w-4 text-tertiary" /> Live Intent Capture Stream
              </h3>
              {calls.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-outline-variant/50 p-6 text-center text-xs text-on-surface-variant">
                  Reachout results will stream in here.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {calls.map((c) => (
                    <ConversationFeed key={c.id} call={c} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
