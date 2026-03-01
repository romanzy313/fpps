import { describe, expect, it, vi } from "vitest";
import { BufferedWriter } from "./BufferedWriter";

function makeWriter(chunkSize: number) {
  const writes: Uint8Array[] = [];
  const underlyingWrite = vi.fn((data: Uint8Array) => {
    writes.push(data.slice());
  });
  const writer = new BufferedWriter(chunkSize, underlyingWrite);
  return { writer, writes, underlyingWrite };
}

function bytes(...values: number[]): Uint8Array {
  return new Uint8Array(values);
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, a) => sum + a.byteLength, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    result.set(a, offset);
    offset += a.byteLength;
  }
  return result;
}

describe("BufferedWriter", () => {
  describe("small chunks", () => {
    it("buffers multiple small chunks that fit within chunkSize", () => {
      const { writer, writes } = makeWriter(8);
      writer.write(bytes(1, 2));
      writer.write(bytes(3, 4));
      expect(writes).toHaveLength(0);
    });

    it("flushes accumulated chunks correctly", () => {
      const { writer, writes } = makeWriter(8);
      writer.write(bytes(1, 2));
      writer.write(bytes(3, 4));
      writer.flush();
      expect(writes).toHaveLength(1);
      expect(writes[0]).toEqual(bytes(1, 2, 3, 4));
    });

    it("does not call underlyingWrite on flush when buffer is empty", () => {
      const { writer, underlyingWrite } = makeWriter(8);
      writer.flush();
      expect(underlyingWrite).not.toHaveBeenCalled();
    });

    it("resets position after flush so buffer can be reused", () => {
      const { writer, writes } = makeWriter(8);
      writer.write(bytes(1, 2, 3));
      writer.flush();
      writer.write(bytes(4, 5));
      writer.flush();
      expect(writes).toHaveLength(2);
      expect(writes[0]).toEqual(bytes(1, 2, 3));
      expect(writes[1]).toEqual(bytes(4, 5));
    });
  });

  describe("large chunks", () => {
    it("bypasses buffer optimization", () => {
      const { writer, writes, underlyingWrite } = makeWriter(4);
      const chunk = bytes(1, 2, 3, 4);
      writer.write(chunk);
      expect(underlyingWrite).toHaveBeenCalledTimes(1);
      expect(writes[0]).toEqual(chunk);
    });

    it(
      "bypasses buffer for chunk larger than chunkSize",
      { skip: true },
      () => {
        const { writer, writes } = makeWriter(4);
        const chunk = bytes(1, 2, 3, 4, 5, 6);
        writer.write(chunk);
        expect(writes).toHaveLength(1);
        expect(writes[0]).toEqual(chunk);
      },
    );

    it("handles large chunks with some buffer", () => {
      const { writer, writes } = makeWriter(4);
      writer.write(bytes(1)); // put something in the buffer first
      writer.write(bytes(2, 3, 4, 5)); // now write a large chunk

      expect(writes).toHaveLength(2);
      expect(writes[0]).toEqual(bytes(1));
      expect(writes[1]).toEqual(bytes(2, 3, 4, 5));
    });
  });

  describe("chunk fills buffer exactly", () => {
    it("handles edge case", () => {
      const { writer, writes } = makeWriter(4);
      writer.write(bytes(1, 2));
      writer.write(bytes(3, 4));
      writer.write(bytes(5));

      expect(writes).toHaveLength(2);
      expect(writes[0]).toEqual(bytes(1, 2, 3, 4));
      expect(writes[1]).toEqual(bytes(5));
    });
  });

  describe("flush idempotency", () => {
    it("calling flush twice does not double-write", () => {
      const { writer, underlyingWrite } = makeWriter(8);
      writer.write(bytes(1, 2));
      writer.flush();
      writer.flush();

      expect(underlyingWrite).toHaveBeenCalledTimes(1);
    });
  });

  describe("empty writes", () => {
    it("writing an empty chunk does nothing", () => {
      const { writer, underlyingWrite } = makeWriter(8);
      writer.write(new Uint8Array(0));
      writer.flush();

      expect(underlyingWrite).not.toHaveBeenCalled();
    });
  });

  describe("interleaved small and large writes", () => {
    it("handles a sequence of mixed writes and produces correct output", () => {
      const { writer, writes } = makeWriter(4);

      writer.write(bytes(1)); // buffered, pos=1
      writer.write(bytes(2, 3, 4)); // pos+3=4, not < 4 → flush(1,2,3→wait, no: flush writes bytes(1), then sends bytes(2,3,4))
      writer.write(bytes(5, 6, 7, 8)); // pos=0, len=4 >= 4 → bypass
      writer.write(bytes(9)); // buffered
      writer.flush(); // flush bytes(9)

      const received = concat(...writes);
      expect(received).toEqual(bytes(1, 2, 3, 4, 5, 6, 7, 8, 9));
    });
  });
});
