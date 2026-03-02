export type TransferSummary = {
  totalFiles: number;
  totalBytes: number;
};

export function zeroTransferStats(): TransferSummary {
  return transferStatsFromFiles([]);
}

export function transferStatsFromFiles(files: File[]): TransferSummary {
  return {
    totalFiles: files.length,
    totalBytes: files.reduce((acc, file) => acc + file.size, 0),
  };
}
