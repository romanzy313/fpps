export class BufferedWriter {
  private buffer: Uint8Array;
  private pos = 0;

  constructor(
    private chunkSize: number,
    private underlyingWrite: (data: Uint8Array) => void,
  ) {
    this.buffer = new Uint8Array(this.chunkSize);
  }

  private writeSplitByChunks(data: Uint8Array): void {
    if (data.byteLength <= this.chunkSize) {
      this.underlyingWrite(data);
      return;
    }

    const numChunks = Math.ceil(data.byteLength / this.chunkSize);

    console.warn("writing large payload as multiple chunks chunks", {
      chunkSize: this.chunkSize,
      numChunks,
      chunkLength: data.byteLength,
    });

    for (let i = 0; i < numChunks; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, data.byteLength);
      this.underlyingWrite(data.slice(start, end));
    }
  }

  write(chunk: Uint8Array): void {
    // optimization for large chunks
    if (this.pos === 0 && chunk.byteLength >= this.chunkSize) {
      this.writeSplitByChunks(chunk);
    }

    // if we can buffer, then buffer
    if (this.pos + chunk.byteLength <= this.chunkSize) {
      this.buffer.set(chunk, this.pos);
      this.pos += chunk.byteLength;
      return;
    }
    // flush whats there
    this.flush();

    // send as whole
    this.writeSplitByChunks(chunk);
  }

  flush(): void {
    if (this.pos > 0) {
      this.underlyingWrite(this.buffer.slice(0, this.pos));
      this.pos = 0;
    }
  }
}
