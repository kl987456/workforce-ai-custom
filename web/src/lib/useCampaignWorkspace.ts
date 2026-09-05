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
    // Hunar delivers call_status_updated, call_recording_done, and
    // call_result_done as separate sequential webhooks — status can flip to
    // COMPLETED many seconds before the result payload arrives. Keep polling
    // a completed-but-resultless call so the extracted answers actually show
    // up, without polling forever for statuses that will never get a result
    // (FAILED/NOT_CONNECTED/CANCELLED never had a conversation to extract).
    const hasActive = calls.some((c) => {
      if (!TERMINAL_STATUSES.has(c.status)) return true;
      if (c.status === "COMPLETED" && !c.result) return true;
      return false;
    });
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
