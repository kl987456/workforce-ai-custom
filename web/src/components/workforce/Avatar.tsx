import { useState } from "react";
import { avatarPhotoUrl, hashName } from "../../lib/avatarPhoto";

const PALETTE = [
  ["#2563eb", "#dbe1ff"],
  ["#0ea5e9", "#c9e6ff"],
  ["#10b981", "#6ffbbe"],
  ["#f59e0b", "#fde68a"],
  ["#8b5cf6", "#e9d5ff"],
  ["#ec4899", "#fbcfe8"],
];

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const [fg, bg] = PALETTE[hashName(name) % PALETTE.length];

  if (!broken) {
    return (
      <img
        src={avatarPhotoUrl(name)}
        alt={name}
        onError={() => setBroken(true)}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}
