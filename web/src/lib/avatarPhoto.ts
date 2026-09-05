// Headshots pulled from the Stitch design export (people_search_talent_engine
// avatars screen) and saved locally under public/avatars — real design
// assets, not hotlinked to Google's preview CDN. Shared by Avatar.tsx and
// SkillGraph.tsx so the same candidate always gets the same photo everywhere.
export const AVATAR_PHOTO_COUNT = 17;

export function hashName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

export function avatarPhotoUrl(name: string) {
  const photoNum = (hashName(name) % AVATAR_PHOTO_COUNT) + 1;
  return `/avatars/av-${String(photoNum).padStart(2, "0")}.jpg`;
}
