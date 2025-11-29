import path from "path";
import fs from "fs";

export function generateTestFile(kbSize: number, name: string): File {
  // 256byte chunk
  function chunk() {
    const twoFifty = new Uint8Array(256);
    // fill it with values of 0...to 255 in order
    for (let i = 0; i < twoFifty.length; i++) {
      twoFifty[i] = i;
    }
    return twoFifty;
  }

  const chunkCounts = 4 * kbSize;

  const all = Array(chunkCounts).fill(chunk());

  const file = new File(all, name);
  return file;
}

export function getTestFilePath(name: string): string {
  return path.join(__dirname, "__testdata__", name);
}

export async function loadFileChunked(
  path: string,
  chunkSize: number,
): Promise<File> {
  const name = path.split("/").pop()!; // is windows broken here?
  const file = await fs.promises.readFile(path);
  const buffer = file.buffer;

  const chunks: Uint8Array<ArrayBuffer>[] = [];
  for (let i = 0; i < buffer.byteLength; i += chunkSize) {
    const rawChunk = buffer.slice(i, i + chunkSize);
    const chunk = new Uint8Array(rawChunk);
    chunks.push(chunk);
  }

  // return new File(chunks as any, "test.txt");

  return new File(chunks, name);
}

export async function loadFileFull(path: string): Promise<File> {
  const name = path.split("/").pop()!; // is windows broken here?
  const file = await fs.promises.readFile(path);
  const chunk = new Uint8Array(file.buffer, file.byteOffset, file.byteLength);

  return new File([chunk], name);
}
