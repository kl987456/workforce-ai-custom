import type { Campaign, Candidate, Call } from "./types";

// Deployed builds serve the API from the same origin (see /vercel.json
// rewrites) — VITE_API_URL is only needed for local dev, where the Vite
// dev server (5173) and FastAPI (8001) run on different ports.
const BASE = import.meta.env.VITE_API_URL ?? "";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      typeof data?.detail === "string"
        ? data.detail
        : data?.detail
          ? JSON.stringify(data.detail)
          : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  health: () => req<{ hunar: string }>("/api/health"),

  listCampaigns: (kind: "HIRING" | "TALENT_SEARCH") =>
    req<{ campaigns: Campaign[] }>(`/api/campaigns?kind=${kind}`),

  listVoicePersonas: () =>
    req<{ personas: { code: string; name: string }[] }>("/api/campaigns/voice-personas"),

  createCampaign: (body: {
    kind: "HIRING" | "TALENT_SEARCH";
    title: string;
    department?: string;
    location?: string;
    jobDescription: string;
    voicePersona?: string;
  }) =>
    req<{ campaign: Campaign; candidates: Candidate[] }>("/api/campaigns", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getCampaign: (id: string) =>
    req<{ campaign: Campaign; candidates: Candidate[]; calls: Call[] }>(
      `/api/campaigns/${id}`
    ),

  deleteCampaign: (id: string) =>
    req<{ ok: true }>(`/api/campaigns/${id}`, { method: "DELETE" }),

  addCandidate: (
    campaignId: string,
    body: {
      name: string;
      phone: string;
      email?: string;
      roleTitle?: string;
      location?: string;
      skills?: string[];
    }
  ) =>
    req<{ candidate: Candidate }>(`/api/campaigns/${campaignId}/candidates`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  createCall: (body: {
    candidateId: string;
    purpose: "HIRING_SCREEN" | "TALENT_REACHOUT";
    campaignId?: string;
    phoneOverride?: string;
  }) =>
    req<{ call: Call }>("/api/calls", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  createBulkCalls: (body: {
    candidateIds: string[];
    purpose: "HIRING_SCREEN" | "TALENT_REACHOUT";
    campaignId?: string;
  }) =>
    req<{ placed: Call[]; errors: { candidateId: string; error: string }[] }>(
      "/api/calls/bulk",
      { method: "POST", body: JSON.stringify(body) }
    ),
};
