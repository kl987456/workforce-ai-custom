const HEIGHTS = [40, 65, 30, 80, 50, 90, 35, 70, 45, 60, 25, 85, 55, 75, 40, 65, 30, 80, 50, 60];
const COLORS = ["var(--color-primary-container)", "var(--color-secondary-container)", "var(--color-tertiary-container)"];

/** Decorative CSS waveform — indicates "audio is live/recording", not driven by real amplitude data. */
export function Waveform({ active = true }: { active?: boolean }) {
  return (
    <div className="flex h-10 items-center gap-[3px]" aria-hidden="true">
      {HEIGHTS.map((h, i) => (
        <span
          key={i}
          className={active ? "animate-pulse rounded-full" : "rounded-full opacity-50"}
          style={{
            width: 3,
            height: `${h}%`,
            background: COLORS[i % COLORS.length],
            animationDelay: `${(i % 6) * 0.12}s`,
            animationDuration: "1.1s",
          }}
        />
      ))}
    </div>
  );
}
