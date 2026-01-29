import { RoomParams } from "../../utils/roomParams";
import { apiRead, apiSend } from "./api";

const POLL_INTERVAL_MS = 3000; // Poll every second
const NON_INITIATOR_WAIT_MS = 5000; // Wait 5 seconds before first poll if not initiator

export class SignalingApi {
  private isOn = false;
  private pollTimeout: NodeJS.Timeout | null = null;
  private sendQueue: string[] = [];
  private isFetching = false;
  private fetchQueue: (() => Promise<void>)[] = [];

  constructor(
    private readonly roomParams: RoomParams,
    private callback: (message: string) => void,
  ) {}

  start() {
    if (this.isOn) return;
    this.isOn = true;

    if (!this.roomParams.isInitiator) {
      // Non-initiator waits before first poll
      this.schedulePoll(NON_INITIATOR_WAIT_MS);
    }
    // Initiator doesn't poll until first send
  }

  async stop() {
    if (!this.isOn) return;

    this.isOn = false;
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
    // TODO: this can be improved? no need to do this I think.
    // Wait for any pending fetch to complete
    while (this.isFetching) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    this.sendQueue = [];
    this.fetchQueue = [];
  }

  send(signal: string) {
    if (!this.isOn) return;
    this.sendQueue.push(signal);

    // Trigger send immediately (don't wait for next poll interval)
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }

    this.enqueueFetch(async () => {
      await this.pollOrSend();
    });
  }

  private schedulePoll(delayMs: number) {
    if (!this.isOn) return;

    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
    }

    this.pollTimeout = setTimeout(() => {
      this.enqueueFetch(async () => {
        await this.pollOrSend();
      });
    }, delayMs);
  }

  private async enqueueFetch(fetchFn: () => Promise<void>) {
    this.fetchQueue.push(fetchFn);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isFetching || this.fetchQueue.length === 0) {
      return;
    }

    this.isFetching = true;

    try {
      const fetchFn = this.fetchQueue.shift();
      if (fetchFn) {
        await fetchFn();
      }
    } catch (error) {
      console.error("Signaling error:", error);
      await this.stop();
    } finally {
      this.isFetching = false;

      // Process next item in queue if any
      if (this.fetchQueue.length > 0) {
        this.processQueue();
      }
    }
  }

  private async pollOrSend() {
    if (!this.isOn) return;

    try {
      let messages: string[] = [];

      if (this.sendQueue.length > 0) {
        // Send queued signals and get response
        const signalsToSend = [...this.sendQueue];
        this.sendQueue = [];
        messages = await this.sendApi(signalsToSend);
      } else {
        // Just poll for new messages
        messages = await this.pollApi();
      }

      // Process received messages
      for (const message of messages) {
        try {
          this.callback(message);
        } catch (error) {
          console.error("Error in signaling callback:", error);
        }
      }
    } catch (error) {
      // TODO: this needs display in UI
      console.error("Polling/sending error:", error);
    } finally {
      // Schedule next poll
      if (this.isOn) {
        this.schedulePoll(POLL_INTERVAL_MS);
      }
    }
  }

  private async pollApi(): Promise<string[]> {
    const res = await apiRead({
      me: this.roomParams.myId,
    });

    return res.payloads;
  }

  private async sendApi(signals: string[]): Promise<string[]> {
    const res = await apiSend({
      me: this.roomParams.myId,
      peer: this.roomParams.peerId,
      payloads: signals,
    });

    return res.payloads;
  }
}
