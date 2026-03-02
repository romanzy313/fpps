export class ChunkSplitterTransformer implements Transformer<
  Uint8Array,
  Uint8Array
> {
  private readonly chunkSize: number;
  private buffer: Uint8Array;
  private bufferUsed: number;

  constructor(chunkSize: number = 65536) {
    // 64KB default
    this.chunkSize = chunkSize;
    this.buffer = new Uint8Array(chunkSize);
    this.bufferUsed = 0;
  }

  transform(
    chunk: Uint8Array,
    controller: TransformStreamDefaultController<Uint8Array>,
  ): void {
    let chunkOffset = 0;

    while (chunkOffset < chunk.length) {
      // Calculate how much we can copy to buffer
      const available = this.chunkSize - this.bufferUsed;
      const toCopy = Math.min(available, chunk.length - chunkOffset);

      // Copy data to buffer
      this.buffer.set(
        chunk.subarray(chunkOffset, chunkOffset + toCopy),
        this.bufferUsed,
      );
      this.bufferUsed += toCopy;
      chunkOffset += toCopy;

      // If buffer is full, enqueue it
      if (this.bufferUsed === this.chunkSize) {
        controller.enqueue(this.buffer.slice(0, this.chunkSize));
        this.bufferUsed = 0;
      }
    }
  }

  flush(controller: TransformStreamDefaultController<Uint8Array>): void {
    // Send any remaining data
    if (this.bufferUsed > 0) {
      controller.enqueue(this.buffer.slice(0, this.bufferUsed));
      this.bufferUsed = 0;
    }
  }
}
