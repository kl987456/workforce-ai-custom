import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Mic, Loader2, Users2, PhoneOutgoing, PhoneCall, ThumbsUp, UserPlus,
  BriefcaseBusiness, MapPin, ListChecks, Radio,
} from "lucide-react";
import { staggerContainer, staggerItem } from "../lib/motion";
import { RequisitionSwitcher } from "../components/workforce/RequisitionSwitcher";
import { QueueRow } from "../components/workforce/QueueRow";
import { ConversationFeed } from "../components/workforce/ConversationFeed";
import { InsightsPanel } from "../components/workforce/InsightsPanel";
import { CanvasWaveform } from "../components/workforce/CanvasWaveform";
import { CallHealthGauges } from "../components/workforce/CallHealthGauges";
import { ActivityTicker } from "../components/workforce/ActivityTicker";
import { PersonaPicker } from "../components/workforce/PersonaPicker";
import { Avatar } from "../components/workforce/Avatar";
import { TriggerCallButton } from "../components/workforce/TriggerCallButton";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../components/ui/Toast";
import { api } from "../lib/api";
import { isE164, phoneHint } from "../lib/phone";
import { useCampaignWorkspace } from "../lib/useCampaignWorkspace";

function NewRequisitionModal({ onCreated }: { onCreated: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [voicePersona, setVoicePersona] = useState("NEHA");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function handleCreate() {
    if (!title || !description) {
      toast.error("Title and job description are required");
      return;
    }
    setLoading(true);
    try {
      const data = await api.createCampaign({
        kind: "HIRING", title, department: department || undefined, location: location || undefined, jobDescription: description, voicePersona,
      });
      toast.success("Requisition created");
      setOpen(false);
      setTitle(""); setDepartment(""); setLocation(""); setDescription("");
      onCreated(data.campaign.id);
    } catch (e) {
      toast.error("Could not create requisition", e instanceof Error ? e.message : undefined);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-dashed border-outline-variant/60 px-4 text-sm font-medium text-on-surface-variant hover:bg-surface-container">
        + New requisition
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New hiring requisition"
        description="Candidates added here will be screened by the Hunar Voice AI hiring agent."
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleCreate} disabled={loading} className="gap-1.5">
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Create
            </Button>
          </>
        }
      >
        <input className="h-10 rounded-xl border border-outline-variant/50 px-3 text-sm" placeholder="Staff AI Infrastructure Engineer" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <input className="h-10 rounded-xl border border-outline-variant/50 px-3 text-sm" placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
          <input className="h-10 rounded-xl border border-outline-variant/50 px-3 text-sm" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <textarea className="min-h-24 rounded-xl border border-outline-variant/50 p-3 text-sm" placeholder="Paste the job description here." value={description} onChange={(e) => setDescription(e.target.value)} />
        <PersonaPicker value={voicePersona} onChange={setVoicePersona} />
      </Modal>
    </>
  );
}

function AddCandidateModal({ campaignId, defaultRole, onAdded }: { campaignId: string; defaultRole: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(defaultRole);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const hint = phoneHint(phone);

  async function handleAdd() {
    if (!name || !phone) { toast.error("Name and phone number are required"); return; }
    if (!isE164(phone)) { toast.error("Phone number isn't valid yet", hint ?? undefined); return; }
    setLoading(true);
    try {
      await api.addCandidate(campaignId, { name, phone, email: email || undefined, roleTitle: role });
      toast.success(`${name} added to pipeline`);
      setOpen(false); setName(""); setPhone(""); setEmail("");
      onAdded();
    } catch (e) {
      toast.error("Could not add candidate", e instanceof Error ? e.message : undefined);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <UserPlus className="h-3.5 w-3.5" /> Add candidate
      </Button>
      <Modal
        open={open} onClose={() => setOpen(false)} title="Add a candidate"
        description="Use a real phone number in E.164 format to actually place a Hunar call."
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleAdd} disabled={loading} className="gap-1.5">
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Add
            </Button>
          </>
        }
      >
        <input className="h-10 rounded-xl border border-outline-variant/50 px-3 text-sm" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={`h-10 rounded-xl border px-3 text-sm ${hint ? "border-error" : "border-outline-variant/50"}`} placeholder="+917411771293" value={phone} onChange={(e) => setPhone(e.target.value)} />
        {hint && <p className="text-xs text-error">{hint}</p>}
        <input className="h-10 rounded-xl border border-outline-variant/50 px-3 text-sm" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="h-10 rounded-xl border border-outline-variant/50 px-3 text-sm" placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />
      </Modal>
    </>
  );
}

export function HiringAssistant() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [focusedCandidateId, setFocusedCandidateId] = useState<string | null>(null);
  const { campaign, candidates, calls, loading, refresh } = useCampaignWorkspace(activeId);

  function bump() {
    setRefreshToken((t) => t + 1);
    refresh();
  }

  const latestCallByCandidate = useMemo(() => {
    const map = new Map<string, typeof calls[number]>();
    for (const c of calls) {
      const existing = map.get(c.candidate_id);
      if (!existing || new Date(c.created_at) > new Date(existing.created_at)) map.set(c.candidate_id, c);
    }
    return map;
  }, [calls]);

  const focusedCandidate =
    candidates.find((c) => c.id === focusedCandidateId) ??
    candidates.find((c) => latestCallByCandidate.has(c.id)) ??
    candidates[0];
  const focusedCall = focusedCandidate ? latestCallByCandidate.get(focusedCandidate.id) : undefined;
  const isLive = focusedCall && (focusedCall.status === "IN_PROGRESS" || focusedCall.status === "RINGING");

  const notYetCalled = candidates.filter((c) => !latestCallByCandidate.has(c.id));
  const completed = calls.filter((c) => c.status === "COMPLETED");
  const withRecommendation = completed.filter((c) => c.result?.recommendation);
  const advancing = withRecommendation.filter((c) => c.result?.recommendation === "advance");
  const advanceRate = withRecommendation.length > 0 ? Math.round((advancing.length / withRecommendation.length) * 100) : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-container text-on-primary shadow-[0_0_16px_-2px_var(--color-primary)]">
            <Mic className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Voice Ops Console</h1>
            <p className="font-mono text-[11px] text-on-surface-variant">live outbound hiring-screen dial engine</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <RequisitionSwitcher
          kind="HIRING"
          activeId={activeId}
          onSelect={(id) => { setActiveId(id); setFocusedCandidateId(null); }}
          onNew={() => {}}
          onDeleted={(id) => { if (id === activeId) setActiveId(null); }}
          refreshToken={refreshToken}
        />
        <NewRequisitionModal onCreated={(id) => { bump(); setActiveId(id); }} />
      </div>

      {activeId && calls.length > 0 && <ActivityTicker calls={calls} />}

      {!activeId && (
        <Card>
          <h2 className="text-base font-semibold">Get started</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Create a requisition above, add candidates with real phone numbers, then trigger a
            Hunar Voice AI phone screen. Extracted answers land here automatically once the call
            ends.
          </p>
        </Card>
      )}

      {activeId && loading && <div className="h-64 animate-pulse rounded-2xl bg-surface-container-low" />}

      {activeId && campaign && !loading && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="flex flex-col gap-5 lg:col-span-8">
            {focusedCandidate ? (
              <Card className="flex flex-col gap-4 overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {isLive && (
                        <>
                          <span className="absolute inset-0 rounded-full bg-tertiary/40 animate-ping" />
                          <span className="absolute inset-0 rounded-full bg-tertiary/25 animate-ping" style={{ animationDelay: "0.5s" }} />
                        </>
                      )}
                      <Avatar name={focusedCandidate.name} size={52} />
                      {isLive && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-tertiary ring-2 ring-surface-container-lowest" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold">{focusedCandidate.name}</h2>
                        {isLive && (
                          <span className="flex items-center gap-1 rounded-full bg-tertiary-fixed px-2 py-0.5 text-[10px] font-semibold text-on-tertiary-fixed">
                            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-tertiary" /> LIVE
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-on-surface-variant">
                        <span className="flex items-center gap-1"><BriefcaseBusiness className="h-3 w-3" /> {focusedCandidate.role_title}</span>
                        {focusedCandidate.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {focusedCandidate.location}</span>}
                      </div>
                    </div>
                  </div>
                  <TriggerCallButton
                    candidate={focusedCandidate}
                    campaignId={campaign.id}
                    purpose="HIRING_SCREEN"
                    onCallCreated={bump}
                    label={focusedCall ? "Call again" : "Call — Hunar Screen"}
                  />
                </div>

                {isLive && (
                  <div className="rounded-2xl bg-surface-container-low p-3">
                    <div className="mb-1 flex items-center justify-between text-[11px] font-mono text-on-surface-variant">
                      <span className="flex items-center gap-1"><Radio className="h-3 w-3 text-tertiary" /> LIVE VOICE STREAM</span>
                      <span>Opus 48kHz</span>
                    </div>
                    <CanvasWaveform />
                  </div>
                )}

                {focusedCall && <CallHealthGauges call={focusedCall} />}

                {focusedCall ? (
                  <ConversationFeed call={focusedCall} />
                ) : (
                  <div className="rounded-2xl border border-dashed border-outline-variant/50 p-6 text-center text-sm text-on-surface-variant">
                    No call placed yet for {focusedCandidate.name}.
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-8 text-center text-sm text-on-surface-variant">
                Add a candidate to start screening.
              </Card>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold"><ListChecks className="h-4 w-4" /> Candidate pipeline ({candidates.length})</h3>
                <AddCandidateModal campaignId={campaign.id} defaultRole={campaign.title} onAdded={bump} />
              </div>
              {candidates.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-outline-variant/50 p-8 text-center text-sm text-on-surface-variant">
                  No candidates yet.
                </div>
              ) : (
                <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-1.5">
                  {candidates.map((c) => (
                    <motion.div key={c.id} variants={staggerItem}>
                      <QueueRow
                        candidate={c}
                        campaignId={campaign.id}
                        purpose="HIRING_SCREEN"
                        onCallCreated={bump}
                        latestCall={latestCallByCandidate.get(c.id)}
                        active={c.id === focusedCandidate?.id}
                        onFocus={() => setFocusedCandidateId(c.id)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5 lg:col-span-4">
            <InsightsPanel
              title="Requisition insights"
              insights={[
                { label: "Pipeline size", value: String(candidates.length), icon: Users2 },
                { label: "Screens placed", value: String(calls.length), icon: PhoneOutgoing },
                { label: "Screens completed", value: String(completed.length), icon: PhoneCall },
                { label: "Advance rate", value: advanceRate != null ? `${advanceRate}%` : "—", icon: ThumbsUp, hint: "of screens with a recommendation" },
              ]}
            />

            <Card>
              <h3 className="mb-2 text-sm font-semibold">Autonomous queue ({notYetCalled.length})</h3>
              {notYetCalled.length === 0 ? (
                <p className="text-xs text-on-surface-variant">Everyone in the pipeline has been called at least once.</p>
              ) : (
                <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-1.5">
                  {notYetCalled.map((c) => (
                    <motion.div key={c.id} variants={staggerItem}>
                      <QueueRow candidate={c} campaignId={campaign.id} purpose="HIRING_SCREEN" onCallCreated={bump} onFocus={() => setFocusedCandidateId(c.id)} active={c.id === focusedCandidate?.id} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </Card>

            <Card>
              <div className="flex items-start justify-between gap-2">
                <h3 className="mb-1 text-sm font-semibold">{campaign.title}</h3>
                {campaign.persona_name && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary-fixed px-2 py-0.5 text-[10px] font-semibold text-on-primary-fixed">
                    <Mic className="h-2.5 w-2.5" /> {campaign.persona_name}
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant">
                {[campaign.department, campaign.location].filter(Boolean).join(" · ") || "No department/location set"}
              </p>
              <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-xs text-on-surface-variant">{campaign.job_description}</p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
