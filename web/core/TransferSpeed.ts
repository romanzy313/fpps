export type TransferProgressValue = {
  transferredBytes: number;
  totalBytes: number;
  speedBytesPerSecond: number;
  remainingSeconds: number;
};

// TODO: start with 0, and lerp to 0.5
const SMOOTHING_FACTOR = 0.5;

export class TransferProgress {
  private lastTimeMs = 0;
  private lastTransferredBytes = 0;
  private currentTransferredBytes = 0;
  private totalBytes = 0;

  private averageSpeed = 0;
  private remainingSeconds = 0;

  private progressInterval: NodeJS.Timeout | null = null;

  static zeroValue(): TransferProgressValue {
    return {
      transferredBytes: 0,
      totalBytes: 0,
      speedBytesPerSecond: 0,
      remainingSeconds: 0,
    };
  }

  static isIdleValue(value: TransferProgressValue): boolean {
    return value.speedBytesPerSecond === 0 && value.remainingSeconds === 0;
  }

  get value(): TransferProgressValue {
    return {
      transferredBytes: this.lastTransferredBytes,
      totalBytes: this.totalBytes,
      speedBytesPerSecond: this.averageSpeed,
      remainingSeconds: this.remainingSeconds,
    };
  }

  tick(): void {
    const timeMs = new Date().getTime() / 1000;

    if (this.lastTimeMs === 0) {
      this.lastTimeMs = timeMs;
      this.lastTransferredBytes = this.currentTransferredBytes;
      return;
    }

    const timeDelta = timeMs - this.lastTimeMs;

    const byteDelta = this.currentTransferredBytes - this.lastTransferredBytes;
    const speed = timeDelta > 0 ? byteDelta / timeDelta : 0;

    this.lastTimeMs = timeMs;
    this.lastTransferredBytes = this.currentTransferredBytes;

    this.averageSpeed =
      SMOOTHING_FACTOR * this.averageSpeed + (1 - SMOOTHING_FACTOR) * speed;

    if (this.averageSpeed > 0) {
      this.remainingSeconds =
        (this.totalBytes - this.currentTransferredBytes) / this.averageSpeed;
    } else {
      this.remainingSeconds = Infinity;
    }
  }

  // more bytes were processed
  pushDelta(moreDeltaBytes: number): void {
    const transferredBytes = Math.min(
      this.currentTransferredBytes + moreDeltaBytes,
      this.totalBytes,
    );

    this.currentTransferredBytes = transferredBytes;
  }

  // mock done state
  reset(totalBytes?: number) {
    this.lastTimeMs = 0;
    this.lastTransferredBytes = 0;
    this.currentTransferredBytes = 0;
    if (totalBytes) {
      this.totalBytes = totalBytes;
    }

    this.averageSpeed = 0;
    this.remainingSeconds = 0;

    this.clearInterval();
  }

  // mark as done, 100% progress
  done(): void {
    this.reset();
    this.lastTransferredBytes = this.totalBytes;
  }

  startInterval(intervalMs: number): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }

    this.progressInterval = setInterval(() => {
      this.tick();
    }, intervalMs);
  }

  clearInterval(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }
}
