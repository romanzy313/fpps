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

  const progressRatio = computeProgressRatio(
    transferStats.transferredBytes,
    transferStats.totalBytes,
  );

  const isActive = transferStats.transferredBytes > 0 && progressRatio < 1;

  return (
    <div className="transfer-progress">
      <div className="transfer-progress__row">
        <span className="transfer-progress__label">Files:</span>
        <span className="transfer-progress__value">
          {transferStats.currentIndex} / {transferStats.totalFiles}
        </span>
      </div>
      <div className="transfer-progress__row">
        <span className="transfer-progress__label">Data:</span>
        <span className="transfer-progress__value">
          {formatFileSize(transferStats.transferredBytes)} /{" "}
          {formatFileSize(transferStats.totalBytes)}
        </span>
      </div>
      <div className="transfer-progress__bar-container">
        <div
          className={`transfer-progress__bar ${isActive ? "transfer-progress__bar--active" : ""}`}
          style={{ width: `${progressRatio * 100}%` }}
        ></div>
      </div>
      <div className="transfer-progress__percentage">{progressText}</div>
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
