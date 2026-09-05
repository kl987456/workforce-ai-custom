import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import { TERMINAL_STATUSES, type Campaign, type Candidate, type Call } from "./types";

export function useCampaignWorkspace(campaignId: string | null) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!campaignId) return;
    const data = await api.getCampaign(campaignId);
    setCampaign(data.campaign);
    setCandidates(data.candidates);
    setCalls(data.calls);
  }, [campaignId]);

  useEffect(() => {
    if (!campaignId) {
      setCampaign(null);
      setCandidates([]);
      setCalls([]);
      return;
    }
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [campaignId, refresh]);

  useEffect(() => {
    const hasActive = calls.some((c) => !TERMINAL_STATUSES.has(c.status));
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (hasActive && campaignId) {
      intervalRef.current = setInterval(refresh, 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [calls, campaignId, refresh]);

  return { campaign, candidates, calls, loading, refresh };
}
