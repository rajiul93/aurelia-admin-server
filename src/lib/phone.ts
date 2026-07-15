/**
 * Phone numbers are the buyer's identity, so the admin who types one in and the
 * buyer who types one into the app must land on the same string. Both sides
 * normalize through here: strip everything that is not a digit, keep a leading
 * "+" if there was one, and treat "00" as that "+".
 *
 * This deliberately does not validate country codes — the admin types whatever
 * the buyer gave them, and a wrong number simply never unlocks.
 */
export function normalizePhone(input: string): string {
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith("+") || trimmed.startsWith("00");
  const digits = trimmed.replace(/\D/g, "");
  const withoutTrunk = hasPlus ? digits.replace(/^00/, "") : digits;

  return hasPlus ? `+${withoutTrunk}` : withoutTrunk;
}
