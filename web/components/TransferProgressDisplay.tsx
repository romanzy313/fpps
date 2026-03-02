import { TransferProgress, TransferProgressValue } from "../core";
import { formatDuration } from "../utils/formatDuration";
import { formatSize } from "../utils/formatSize";
import { formatSpeed } from "../utils/formatSpeed";

type Props = {
  progress: TransferProgressValue;
};

export function TransferProgressDisplay({ progress }: Props) {
  const progressText = computeProgressText(
    progress.transferredBytes,
    progress.totalBytes,
  );

  const progressRatio = computeProgressRatio(
    progress.transferredBytes,
    progress.totalBytes,
  );

  // TODO
  const isActive = !TransferProgress.isIdleValue(progress);

  const speedText = formatSpeed(progress.speedBytesPerSecond);

  const etaText = formatDuration(progress.remainingSeconds);

  return (
    <div className="transfer-progress">
      <div className="transfer-progress__header">
        <span
          data-testid="transfer-progress-percentage"
          className="transfer-progress__percentage"
        >
          {progressText}
        </span>
        <div className="transfer-progress__stats">
          <span className="transfer-progress__stat-row">
            <span className="transfer-progress__stat-item">
              <span className="transfer-progress__stat-label">Progress</span>
              <span className="transfer-progress__stat-value">
                {formatSize(progress.transferredBytes)} /{" "}
                {formatSize(progress.totalBytes)}
              </span>
            </span>
          </span>
          <span className="transfer-progress__stat-row">
            <span className="transfer-progress__stat-item">
              <span className="transfer-progress__stat-label">Speed</span>
              <span className="transfer-progress__stat-value">{speedText}</span>
            </span>
            <span className="transfer-progress__stat-sep">·</span>
            <span className="transfer-progress__stat-item">
              <span className="transfer-progress__stat-label">ETA</span>
              <span className="transfer-progress__stat-value">{etaText}</span>
            </span>
          </span>
        </div>
      </div>
      <div className="transfer-progress__bar-container">
        <div
          className={`transfer-progress__bar transfer-progress__bar--active`}
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
