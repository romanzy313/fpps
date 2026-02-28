export type TransferStats = {
  currentIndex: number;
  totalFiles: number;
  transferredBytes: number;
  totalBytes: number;
};

export function zeroTransferStats(): TransferStats {
  return transferStatsFromFiles([]);
}

export function transferStatsFromFiles(files: File[]): TransferStats {
  return {
    currentIndex: 0,
    totalFiles: files.length,
    transferredBytes: 0,
    totalBytes: files.reduce((acc, file) => acc + file.size, 0),
  };
}

export type TransferSpeed = {
  speedBytesPerSecond: number;
  remainingSeconds: number;
};

export type CalcTransferSpeed = (transferredBytes: number) => TransferSpeed;

// TODO: start with 0, and lerp to 0.5
const SMOOTHING_FACTOR = 0.5;

export function makeCalcTransferSpeed(totalBytes: number): CalcTransferSpeed {
  let lastTimeMs = 0;
  let lastTransferredBytes = 0;
  let averageSpeed = 0;

  return (transferredBytes: number) => {
    const timeMs = new Date().getTime() / 1000;
    if (lastTimeMs === 0) {
      lastTimeMs = timeMs;
      lastTransferredBytes = transferredBytes;
      return { speedBytesPerSecond: 0, remainingSeconds: 0 };
    }

    const timeDelta = timeMs - lastTimeMs;
    const byteDelta = transferredBytes - lastTransferredBytes;
    const speed = timeDelta > 0 ? byteDelta / timeDelta : 0;

    lastTimeMs = timeMs;
    lastTransferredBytes = transferredBytes;

    averageSpeed =
      SMOOTHING_FACTOR * averageSpeed + (1 - SMOOTHING_FACTOR) * speed;

    const remainingSeconds = (totalBytes - transferredBytes) / averageSpeed;

    return { speedBytesPerSecond: averageSpeed, remainingSeconds };
  };
}
