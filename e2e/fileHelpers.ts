import * as fflate from "fflate";
import Stream from "stream";

type PlaywrightMemFile = {
  name: string;
  mimeType: string;
  buffer: Buffer;
};

// TODO: in future, write to disk?
export function generateTestFiles(args: {
  count: number;
  sizeBytes: number;
}): PlaywrightMemFile[] {
  return Array.from({ length: args.count }, (_, i) => {
    const name = `${i}.test`;
    return generateRandomFile({
      name,
      sizeBytes: args.sizeBytes,
      randomFn: Math.random,
    });
  });
}

export function generateRandomFile({
  name,
  sizeBytes,
  randomFn,
}: {
  name: string;
  sizeBytes: number;
  randomFn: () => number;
}): PlaywrightMemFile {
  const arr = new Uint8Array(sizeBytes);

  for (let i = 0; i < arr.length; i++) {
    arr[i] = Math.floor(randomFn() * 256);
  }

  return {
    name,
    mimeType: "test/stuff",
    buffer: Buffer.from(arr),
  };
}

export function assertFilesAreTheSame(
  a: PlaywrightMemFile[],
  b: PlaywrightMemFile[],
) {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (!assertSameFile(a[i], b[i])) return false;
  }

  return true;
}

export function assertSameFile(a: PlaywrightMemFile, b: PlaywrightMemFile) {
  if (a.name !== b.name) return false;
  if (a.mimeType !== b.mimeType) return false;

  const aBytes = a.buffer;
  const bBytes = b.buffer;

  if (aBytes.length !== bBytes.length) return false;

  return aBytes.every((value, index) => value === bBytes[index]);
}

async function streamToBuffer(stream: Stream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

export async function unzipFromStream(
  stream: Stream,
): Promise<PlaywrightMemFile[]> {
  const zipBuffer = await streamToBuffer(stream);

  const unzipped = await new Promise<fflate.Unzipped>((resolve, reject) => {
    fflate.unzip(new Uint8Array(zipBuffer), (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

  const files: PlaywrightMemFile[] = Object.entries(unzipped)
    .filter(([name]) => !name.endsWith("/")) // skip directory entries
    .map(([name, data]) => ({
      name,
      mimeType: "test/stuff",
      buffer: Buffer.from(data),
    }));

  return files;
}
