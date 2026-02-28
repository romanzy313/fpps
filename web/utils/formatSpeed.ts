import { formatSize } from "./formatSize";

export function formatSpeed(bytesPerSecond: number): string {
  const unit = formatSize(bytesPerSecond);

  return `${unit}/s`;
}
