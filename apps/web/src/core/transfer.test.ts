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
  let uploader: Uploader;
  let downloader: Downloader;

  let writableStream: WritableStream<Uint8Array>;
  let files: {
    name: string;
    data: Uint8Array;
  }[] = [];
  let writableClosed: boolean = false;

  function newWritableStream() {
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

    writableClosed = false;
    writableStream = new WritableStream<Uint8Array>({
      write(chunk) {
        unzipper.push(chunk);
      },
      close() {
        writableClosed = true;
      },
      abort() {
        writableClosed = true;
      },
    });
  }

  beforeEach(() => {
    testChannels = new TestPeerChannels(0.05);

    uploader = new Uploader(testChannels.getPeerChannel("a"));
    downloader = new Downloader(testChannels.getPeerChannel("b"));

    newWritableStream();
  });

  it("should upload a file", async () => {
    const file = new File(["42"], "test.txt");
    uploader.setFiles([file]);

    expect(uploader.status.value).toBe("idle");
    expect(downloader.status.value).toBe("idle");

    downloader.start(writableStream);

    await vi.waitUntil(() => uploader.status.value === "done");
    await vi.waitUntil(() => downloader.status.value === "done");

    await vi.waitUntil(() => writableClosed);

    expect(files.length).toBe(1);
    expect(files[0]!.name).toBe("test.txt");
    expect(files[0]!.data).toEqual(
      new Uint8Array(new TextEncoder().encode("42")),
    );
  });

  it("should upload chunked file", async () => {
    const file = new File(["why ", "hello ", "there?"], "test.txt");

    uploader.setFiles([file]);

    expect(uploader.status.value).toBe("idle");
    expect(downloader.status.value).toBe("idle");

    downloader.start(writableStream);

    await vi.waitUntil(() => uploader.status.value === "done");
    await vi.waitUntil(() => downloader.status.value === "done");

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

    uploader.setFiles([file1, file2]);

    expect(downloader.status.value).toBe("idle");
    expect(uploader.status.value).toBe("idle");

    downloader.start(writableStream);

    await vi.waitUntil(() => uploader.status.value === "done");
    await vi.waitUntil(() => downloader.status.value === "done");

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

  it("should upload empty files", async () => {
    const file = new File([""], "empty.txt");
    uploader.setFiles([file, file, file]);

    expect(uploader.status.value).toBe("idle");
    expect(downloader.status.value).toBe("idle");

    downloader.start(writableStream);

    await vi.waitUntil(() => uploader.status.value === "done");
    await vi.waitUntil(() => downloader.status.value === "done");

    await vi.waitUntil(() => writableClosed);

    expect(files.length).toBe(3);
    expect(files[0]!.name).toBe("empty.txt");
    expect(files[0]!.data).toEqual(
      new Uint8Array(new TextEncoder().encode("")),
    );
  });

  it(
    "should upload many large chunked files",
    { timeout: 10_000 },
    async () => {
      const file3 = generateTestFile(500, "test-large"); // 0.5Mb

      uploader.setFiles([file3, file3]);

      expect(uploader.status.value).toBe("idle");
      expect(downloader.status.value).toBe("idle");

      downloader.start(writableStream);

      await vi.waitUntil(() => uploader.status.value === "done", {
        timeout: 10_000,
      });
      await vi.waitUntil(() => downloader.status.value === "done");

      await vi.waitUntil(() => writableClosed);

      expect(files.length).toBe(2);
      expect(files[0]!.name).toBe("test-large");
      expect(files[0]!.data).toEqual(await file3.bytes());
    },
  );

  it("should start a second transfer", async () => {
    const file1 = new File(["first"], "first.txt");

    uploader.setFiles([file1]);

    expect(uploader.status.value).toBe("idle");
    expect(downloader.status.value).toBe("idle");

    downloader.start(writableStream);

    await vi.waitUntil(() => uploader.status.value === "done");
    await vi.waitUntil(() => downloader.status.value === "done");
    await vi.waitUntil(() => writableClosed);

    expect(files.length).toBe(1);
    expect(files[0]!.name).toBe("first.txt");
    expect(files[0]!.data).toEqual(
      new Uint8Array(new TextEncoder().encode("first")),
    );

    const file2 = new File(["second"], "second.txt");

    uploader.setFiles([file2]);

    newWritableStream();
    downloader.start(writableStream);

    await vi.waitUntil(() => uploader.status.value === "done");
    await vi.waitUntil(() => downloader.status.value === "done");

    expect(files.length).toBe(1);
    expect(files[0]!.name).toBe("second.txt");
  });

  it("should abort transfer via uploader", async () => {
    const fileLarge = generateTestFile(10_000, "test-large"); // 10Mb

    uploader.setFiles([fileLarge]);

    expect(uploader.status.value).toBe("idle");
    expect(downloader.status.value).toBe("idle");

    downloader.start(writableStream);

    await vi.waitUntil(() => uploader.status.value === "transfer", {
      timeout: 1000,
      interval: 1,
    });
    uploader.abort();

    await vi.waitUntil(() => uploader.status.value === "aborted");
    await vi.waitUntil(() => downloader.status.value === "aborted");

    await vi.waitUntil(() => writableClosed);

    // can start again
    const file = new File(["restart"], "restart.txt");
    uploader.setFiles([file]);

    newWritableStream();
    downloader.start(writableStream);

    await vi.waitUntil(() => uploader.status.value === "done");
    await vi.waitUntil(() => downloader.status.value === "done");

    expect(files.length).toBe(1);
    expect(files[0]!.name).toBe("restart.txt");
  });

  it("should abort transfer via downloader", async () => {
    const fileLarge = generateTestFile(10_000, "test-large"); // 10Mb

    uploader.setFiles([fileLarge]);

    expect(uploader.status.value).toBe("idle");
    expect(downloader.status.value).toBe("idle");

    downloader.start(writableStream);

    await vi.waitUntil(() => downloader.status.value === "transfer", {
      timeout: 1000,
      interval: 1,
    });
    downloader.abort();

    await vi.waitUntil(() => uploader.status.value === "aborted");
    await vi.waitUntil(() => downloader.status.value === "aborted");

    await vi.waitUntil(() => writableClosed);

    // can start again
    const file = new File(["restart"], "restart.txt");
    uploader.setFiles([file]);

    newWritableStream();
    downloader.start(writableStream);

    await vi.waitUntil(() => uploader.status.value === "done");
    await vi.waitUntil(() => downloader.status.value === "done");

    expect(files.length).toBe(1);
    expect(files[0]!.name).toBe("restart.txt");
  });
});
