export function formatDuration(seconds: number): string {
  if (seconds >= 10 * 3600) {
    return "     ∞";
  }

  const hours = seconds / 3600;
  const minutes = seconds / 60;

  if (hours >= 1) {
    const formatted = hours.toFixed(1);
    return `${formatted} hr`.padStart(6);
  }

  if (minutes >= 1) {
    const mins = Math.floor(minutes);
    return `${mins} min`.padStart(6);
  }

  const secs = Math.floor(seconds);
  return `${secs} sec`.padStart(6);
}
