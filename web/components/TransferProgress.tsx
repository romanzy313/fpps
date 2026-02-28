import { TransferStats, TransferSpeed } from "../core";
import { formatDuration } from "../utils/formatDuration";
import { formatSize } from "../utils/formatSize";
import { formatSpeed } from "../utils/formatSpeed";

type Props = {
  stats: TransferStats;
  speed: TransferSpeed | null;
};

export function TransferProgress({
  stats: transferStats,
  speed: transferSpeed,
}: Props) {
  const progressText = computeProgressText(
    transferStats.transferredBytes,
    transferStats.totalBytes,
  );

  const progressRatio = computeProgressRatio(
    transferStats.transferredBytes,
    transferStats.totalBytes,
  );

  const isActive = transferStats.transferredBytes > 0 && progressRatio < 1;

  return (
    <div className="transfer-progress">
      <div className="transfer-progress__info">
        <span className="transfer-progress__percentage">{progressText}</span>
        <span className="transfer-progress__stats">
          {transferStats.currentIndex} / {transferStats.totalFiles} files ·{" "}
          {formatSize(transferStats.transferredBytes)} /{" "}
          {formatSize(transferStats.totalBytes)} ·{" "}
          {transferSpeed
            ? formatSpeed(transferSpeed.speedBytesPerSecond)
            : "---"}{" "}
          ·{" "}
          {transferSpeed
            ? formatDuration(transferSpeed.remainingSeconds)
            : "---"}
        </span>
      </div>
      <div className="transfer-progress__bar-container">
        <div
          className={`transfer-progress__bar ${isActive ? "transfer-progress__bar--active" : ""}`}
          style={{ width: `${progressRatio * 100}%` }}
        ></div>
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
