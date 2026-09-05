export const E164_REGEX = /^\+[1-9]\d{6,14}$/;

export function isE164(phone: string): boolean {
  return E164_REGEX.test(phone.trim());
}

export function phoneHint(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;
  if (isE164(trimmed)) return null;
  if (!trimmed.startsWith("+")) {
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length === 10) {
      return `Missing country code — for example, in India that'd be +91${digits}`;
    }
    return "Must start with + and a country code (no spaces or dashes), e.g. +917411771293";
  }
  return "Must be + followed by 7–15 digits only, e.g. +917411771293";
}
