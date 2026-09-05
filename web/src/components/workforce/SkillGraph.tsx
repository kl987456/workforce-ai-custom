import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Candidate } from "../../lib/types";
import { avatarPhotoUrl } from "../../lib/avatarPhoto";

function scoreColor(score: number | null) {
  if (score == null) return "var(--color-outline)";
  if (score >= 75) return "#10b981";
  if (score >= 50) return "#f59e0b";
  return "var(--color-outline)";
}

const WIDTH = 680;
const HEIGHT = 460;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;
const MAX_NODES = 28;

// Distance from the center IS the match signal — a high score sits close in,
// a weak one is pushed to the rim. Node radius (photo size) also grows with
// score so the strongest matches read as bigger, closer, and brighter.
const MIN_DIST = 70;
const MAX_DIST = 215;
const MIN_R = 12;
const MAX_R = 20;
const NODE_GAP = 10; // minimum breathing room between two avatar edges
const RELAX_ITERATIONS = 80;
const SPRING_BACK = 0.04; // pull toward the ideal score-distance each iteration

// Radar-sweep wedge — a rotating pie slice used purely as a decorative scan
// animation behind the graph, same spirit as the Waveform/CanvasWaveform.
const SWEEP_RADIUS = 235;
const SWEEP_ANGLE = 0.4;
const SWEEP_PATH = `M ${CX} ${CY} L ${CX} ${CY - SWEEP_RADIUS} L ${CX + SWEEP_RADIUS * Math.sin(SWEEP_ANGLE)} ${
  CY - SWEEP_RADIUS * Math.cos(SWEEP_ANGLE)
} Z`;

/**
 * Radial match graph: the requisition at the center, candidates scattered
 * around it at a distance driven by their real match_score (close = strong
 * match, far = weak) — not a decorative network, a visualization of the same
 * ranking the cards below show. Click a node to add/remove it from Batch Dial.
 */
export function SkillGraph({
  candidates,
  selected,
  onToggleSelect,
}: {
  candidates: Candidate[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
}) {
  const [hoverId, setHoverId] = useState<string | null>(null);

  const nodes = useMemo(() => {
    const sorted = [...candidates].sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0));
    const capped = sorted.slice(0, MAX_NODES);

    const laid = capped.map((c, i) => {
      const normalized = Math.max(0, Math.min(1, (c.match_score ?? 15) / 100));
      const dist = MAX_DIST - normalized * (MAX_DIST - MIN_DIST);
      const angle = (i / Math.max(1, capped.length)) * Math.PI * 2 - Math.PI / 2;
      const tx = CX + Math.cos(angle) * dist;
      const ty = CY + Math.sin(angle) * dist;
      return { candidate: c, x: tx, y: ty, tx, ty, r: MIN_R + normalized * (MAX_R - MIN_R) };
    });

    // Relax overlapping avatars apart while gently pulling each one back
    // toward its ideal match-score distance, so "closer = stronger match"
    // stays legible even once nodes are spaced out enough not to collide.
    for (let iter = 0; iter < RELAX_ITERATIONS; iter++) {
      for (let i = 0; i < laid.length; i++) {
        for (let j = i + 1; j < laid.length; j++) {
          const a = laid[i];
          const b = laid[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.01;
          const minDist = a.r + b.r + NODE_GAP;
          if (dist < minDist) {
            const push = (minDist - dist) / 2;
            const ux = dx / dist;
            const uy = dy / dist;
            a.x -= ux * push;
            a.y -= uy * push;
            b.x += ux * push;
            b.y += uy * push;
          }
        }
      }
      for (const n of laid) {
        n.x += (n.tx - n.x) * SPRING_BACK;
        n.y += (n.ty - n.y) * SPRING_BACK;
      }
    }

    return laid;
  }, [candidates]);

  if (nodes.length === 0) return null;

  const hovered = nodes.find((n) => n.candidate.id === hoverId);
  const truncated = candidates.length > nodes.length;

  return (
    <div className="relative rounded-2xl border border-outline-variant/30 bg-surface-container-lowest bg-graph-dots p-3">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ maxHeight: 420 }}>
        <defs>
          <radialGradient id="sweepFade" cx="0%" cy="50%" r="100%">
            <stop offset="0%" stopColor="var(--color-tertiary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-tertiary)" stopOpacity="0" />
          </radialGradient>
          {nodes.map((n) => (
            <clipPath id={`sg-clip-${n.candidate.id}`} key={`clip-${n.candidate.id}`}>
              <circle cx={n.x} cy={n.y} r={n.r - 1.5} />
            </clipPath>
          ))}
        </defs>

        <motion.g
          style={{ transformOrigin: `${CX}px ${CY}px` }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 7, ease: "linear" }}
        >
          <path d={SWEEP_PATH} fill="url(#sweepFade)" />
        </motion.g>

        {[MIN_DIST, (MIN_DIST + MAX_DIST) / 2, MAX_DIST].map((r) => (
          <circle key={r} cx={CX} cy={CY} r={r} fill="none" stroke="var(--color-outline-variant)" strokeDasharray="2 4" opacity={0.5} />
        ))}

        {nodes.map((n) => {
          const dim = hoverId !== null && hoverId !== n.candidate.id;
          const baseOpacity = n.candidate.match_score != null ? Math.max(0.15, n.candidate.match_score / 100) : 0.15;
          return (
            <line
              key={`l-${n.candidate.id}`}
              x1={CX}
              y1={CY}
              x2={n.x}
              y2={n.y}
              stroke={scoreColor(n.candidate.match_score)}
              strokeWidth={selected.has(n.candidate.id) ? 2 : 1}
              opacity={dim ? 0.08 : baseOpacity}
            />
          );
        })}

        <circle cx={CX} cy={CY} r={24} fill="var(--color-primary-container)" />
        <text x={CX} y={CY + 4} textAnchor="middle" fill="var(--color-on-primary)" style={{ fontSize: 10, fontWeight: 700 }}>
          JOB
        </text>

        {nodes.map((n, i) => {
          const isSel = selected.has(n.candidate.id);
          const dim = hoverId !== null && hoverId !== n.candidate.id;
          const color = scoreColor(n.candidate.match_score);
          return (
            <motion.g
              key={n.candidate.id}
              onMouseEnter={() => setHoverId(n.candidate.id)}
              onMouseLeave={() => setHoverId(null)}
              onClick={() => onToggleSelect(n.candidate.id)}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: dim ? 0.3 : 1, scale: 1 }}
              transition={{ scale: { delay: i * 0.015, type: "spring", stiffness: 300, damping: 18 }, opacity: { duration: 0.15 } }}
              style={{ cursor: "pointer", transformOrigin: `${n.x}px ${n.y}px` }}
            >
              <circle cx={n.x} cy={n.y} r={n.r} fill="var(--color-surface-container-lowest)" stroke={color} strokeWidth={isSel ? 3 : 2} />
              <image
                href={avatarPhotoUrl(n.candidate.name)}
                x={n.x - n.r + 1.5}
                y={n.y - n.r + 1.5}
                width={(n.r - 1.5) * 2}
                height={(n.r - 1.5) * 2}
                clipPath={`url(#sg-clip-${n.candidate.id})`}
                preserveAspectRatio="xMidYMid slice"
              />
              {isSel && <circle cx={n.x} cy={n.y} r={n.r + 3} fill="none" stroke="var(--color-primary)" strokeWidth={1.5} />}
              <title>{`${n.candidate.name} · ${n.candidate.match_score != null ? Math.round(n.candidate.match_score) + "%" : "no score"}`}</title>
            </motion.g>
          );
        })}
      </svg>

      {hovered && (
        <div className="pointer-events-none absolute left-4 top-4 max-w-[220px] rounded-xl border border-outline-variant/40 bg-surface-container-lowest/95 p-3 text-xs shadow-lg backdrop-blur">
          <div className="font-semibold text-on-surface">{hovered.candidate.name}</div>
          <div className="text-on-surface-variant">
            {hovered.candidate.role_title}
            {hovered.candidate.company ? ` · ${hovered.candidate.company}` : ""}
          </div>
          <div className="mt-1 font-mono text-[11px]" style={{ color: scoreColor(hovered.candidate.match_score) }}>
            {hovered.candidate.match_score != null ? `${Math.round(hovered.candidate.match_score)}% match` : "no score"}
          </div>
          {hovered.candidate.skills.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {hovered.candidate.skills.slice(0, 4).map((s) => (
                <span key={s} className="rounded-md bg-surface-container-low px-1.5 py-0.5 text-[10px]">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="mt-2 text-center text-[10px] text-on-surface-variant">
        Closer to center = stronger match · click a node to add/remove it from Batch Dial
        {truncated ? ` · showing top ${nodes.length} of ${candidates.length}` : ""}
      </p>
    </div>
  );
}
