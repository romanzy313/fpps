export class ChunkedWriter {
  private buffer: Uint8Array;
  private pos = 0;

  constructor(
    private chunkSize: number,
    private underlyingWrite: (data: Uint8Array) => void,
  ) {
    this.buffer = new Uint8Array(this.chunkSize);
  }

  write(chunk: Uint8Array): void {
    // optimization for large chunks
    if (this.pos === 0 && chunk.byteLength >= this.chunkSize) {
      console.log("Writing large chunk of size", chunk.byteLength);
      this.underlyingWrite(chunk);
      return;
    }

    // if we can buffer
    if (this.pos + chunk.byteLength < this.chunkSize) {
      // buffer
      this.buffer.set(chunk, this.pos);
      this.pos += chunk.byteLength;
      return;
    }
    // flush whats there
    this.flush();

    // send as whole
    this.underlyingWrite(chunk);
  }

  flush(): void {
    if (this.pos > 0) {
      this.underlyingWrite(this.buffer.slice(0, this.pos));
      this.pos = 0;
    }
  }
}
