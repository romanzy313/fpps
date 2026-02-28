export function formatDuration(seconds: number): string {
  if (seconds >= 24 * 3600) {
    return "∞";
  }

  const hours = seconds / 3600;
  const minutes = seconds / 60;

  if (hours >= 1) {
    const formatted = hours.toFixed(1);
    return `${formatted} hr`;
  }

  if (minutes >= 1) {
    const mins = Math.floor(minutes);
    return `${mins} min`;
  }

  const secs = Math.floor(seconds);
  return `${secs} sec`;
}
