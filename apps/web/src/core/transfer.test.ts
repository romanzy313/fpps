import { beforeEach, describe, expect, it, vi } from "vitest";
import { Uploader } from "./Uploader";
import { TestPeerChannels } from "./TestPeerChannels";
import { Downloader } from "./Downloader";
import { UnzipInflate } from "fflate";
import { Unzip } from "fflate";
import { generateTestFile } from "./testUtils";

describe("TestPeerChannels", () => {
  it("should create a new instance", () => {
    const testChannels = new TestPeerChannels(0.5);
    expect(testChannels).toBeDefined();

    const peerA = testChannels.getPeerChannel("a");

    peerA.send({
      type: "ping",
    });

    vi.waitFor(() => {
      expect(testChannels.getReceivedMessages("b").length).toBe(1);
      expect(testChannels.getReceivedMessages("b")[0]).toStrictEqual({
        type: "ping",
      });
      expect(testChannels.getSentMessages("a").length).toBe(1);
      expect(testChannels.getSentMessages("a")[0]).toStrictEqual({
        type: "ping",
      });
    });
  });
});

describe("Uploader", () => {
  let testChannels: TestPeerChannels;
  let writableStream: WritableStream<Uint8Array>;
  let files: {
    name: string;
    data: Uint8Array;
  }[] = [];
  let writableClosed: boolean = false;
  // const written: Uint8Array[] = [];

  beforeEach(() => {
    testChannels = new TestPeerChannels(0.05);

    files = [];

    const unzipper = new Unzip((file) => {
      const inst = {
        name: file.name,
        data: new Uint8Array(),
      };
      files.push(inst);

      file.ondata = (_err, chunk) => {
        inst.data = new Uint8Array([...inst.data, ...chunk]);
      };
      file.start();
    });
    unzipper.register(UnzipInflate);

    writableStream = new WritableStream<Uint8Array>({
      write(chunk) {
        unzipper.push(chunk);
      },
      close() {
        writableClosed = true;
      },
    });
  });

  it("should upload a file", async () => {
    const file = new File(["42"], "test.txt");
    const uploader = new Uploader(testChannels.getPeerChannel("a"), [file]);
    const downloader = new Downloader(
      testChannels.getPeerChannel("b"),
      writableStream,
    );

    expect(uploader.getStatus()).toBe("uploading");

    await vi.waitUntil(() => uploader.getStatus() === "done");
    await vi.waitUntil(() => downloader.getStatus() === "done");

    await vi.waitUntil(() => writableClosed);

    expect(files.length).toBe(1);
    expect(files[0]!.name).toBe("test.txt");
    expect(files[0]!.data).toEqual(
      new Uint8Array(new TextEncoder().encode("42")),
    );
  });

  it("should upload chunked file", async () => {
    const file = new File(["why ", "hello ", "there?"], "test.txt");
    const uploader = new Uploader(testChannels.getPeerChannel("a"), [file]);
    const downloader = new Downloader(
      testChannels.getPeerChannel("b"),
      writableStream,
    );

    expect(uploader.getStatus()).toBe("uploading");

    await vi.waitUntil(() => uploader.getStatus() === "done");
    await vi.waitUntil(() => downloader.getStatus() === "done");

    await vi.waitUntil(() => writableClosed);

    expect(files.length).toBe(1);
    expect(files[0]!.name).toBe("test.txt");
    expect(files[0]!.data).toEqual(
      new Uint8Array(new TextEncoder().encode("why hello there?")),
    );
  });

  it("should upload many chunked files", async () => {
    const file1 = new File(["why ", "hello ", "there?"], "test1.txt");
    const file2 = new File(["are ", "we ", "there ", "yet?"], "test2.txt");
    const uploader = new Uploader(testChannels.getPeerChannel("a"), [
      file1,
      file2,
    ]);
    const downloader = new Downloader(
      testChannels.getPeerChannel("b"),
      writableStream,
    );

    expect(uploader.getStatus()).toBe("uploading");

    await vi.waitUntil(() => uploader.getStatus() === "done", {
      timeout: 3_000,
    });
    await vi.waitUntil(() => downloader.getStatus() === "done");

    await vi.waitUntil(() => writableClosed);

    expect(files.length).toBe(2);
    expect(files[0]!.name).toBe("test1.txt");
    expect(files[0]!.data).toEqual(
      new Uint8Array(new TextEncoder().encode("why hello there?")),
    );
    expect(files[1]!.name).toBe("test2.txt");
    expect(files[1]!.data).toEqual(
      new Uint8Array(new TextEncoder().encode("are we there yet?")),
    );
  });

  it("should upload many large chunked file", async () => {
    const file3 = generateTestFile(20, "test-large"); // 20 kb
    // console.log("FILE3", file3, "SIZE", (await file3.slice().bytes()).length);
    const uploader = new Uploader(testChannels.getPeerChannel("a"), [file3]);
    const downloader = new Downloader(
      testChannels.getPeerChannel("b"),
      writableStream,
    );

    expect(uploader.getStatus()).toBe("uploading");

    await vi.waitUntil(() => uploader.getStatus() === "done");
    await vi.waitUntil(() => downloader.getStatus() === "done");

    await vi.waitUntil(() => writableClosed);

    expect(files.length).toBe(1);
    expect(files[0]!.name).toBe("test-large");
    expect(files[0]!.data.length).toEqual(20 * 1024);
  });
});
