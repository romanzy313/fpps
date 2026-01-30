import { TransferStats } from "../core/PeerChannel";
import { formatFileSize } from "../utils/formatSize";

type Props = {
  stats: TransferStats;
};
export function TransferProgress({ stats: transferStats }: Props) {
  const progressText = computeProgressText(
    transferStats.transferredBytes,
    transferStats.totalBytes,
  );

  return (
    <div>
      <div>
        <span>{transferStats.currentIndex}</span> out of{" "}
        <span>{transferStats.totalFiles}</span> files
      </div>
      <div>
        <span>{formatFileSize(transferStats.transferredBytes)}</span> out of{" "}
        <span>{formatFileSize(transferStats.totalBytes)}</span>
      </div>
      <div>
        Progress: <span>{progressText}</span>
      </div>
    </div>
  );
}

export function computeProgressText(current: number, total: number): string {
  const ratio = computeProgressRatio(current, total);
  if (ratio === 0) {
    return "0%";
  } else if (ratio === 1) {
    return "100%";
  }

  return (ratio * 100).toFixed(2) + "%";
}

export function computeProgressRatio(current: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return current / total;
}
