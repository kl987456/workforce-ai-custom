// Mirrors app/lib/agent_templates.py VOICE_PERSONAS on the backend — the six
// voice_persona values Hunar's /agents API accepts.
export const VOICE_PERSONAS = [
  { code: "NEHA", name: "Neha", blurb: "Warm, structured — default hiring screen voice" },
  { code: "ROY", name: "Roy", blurb: "Direct, brisk — default reachout voice" },
  { code: "ZOE", name: "Zoe", blurb: "Friendly, upbeat" },
  { code: "SAM", name: "Sam", blurb: "Calm, measured" },
  { code: "MIRA", name: "Mira", blurb: "Polished, formal" },
  { code: "EESHA", name: "Eesha", blurb: "Energetic, conversational" },
] as const;

export type VoicePersonaCode = (typeof VOICE_PERSONAS)[number]["code"];
