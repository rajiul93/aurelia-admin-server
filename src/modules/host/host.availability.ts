export function computeIsAvailableNow(
  isActive: boolean,
  availableFrom: string | null,
  availableTo: string | null,
  now = new Date()
): boolean {
  if (!isActive) return false;

  if (!availableFrom || !availableTo) return true;

  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;

  if (availableFrom <= availableTo) {
    return currentTime >= availableFrom && currentTime < availableTo;
  }

  return currentTime >= availableFrom || currentTime < availableTo;
}
