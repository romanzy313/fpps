// import { RoomParams } from "../../utils/roomParams";
// import { apiRead, apiSend, SignalingPayload as string } from "./api";
// import { Signaling } from "./REWORK";

// const POLL_INTERVAL_MS = 3000; // Poll every second
// const NON_INITIATOR_WAIT_MS = 5000; // Wait 5 seconds before first poll if not initiator

// export class SignalingImpl implements Signaling {
//   private isOn = false;
//   private pollTimeout: NodeJS.Timeout | null = null;
//   private sendQueue: string[] = [];
//   private isFetching = false;
//   private fetchQueue: (() => Promise<void>)[] = [];

//   constructor(
//     private readonly roomParams: RoomParams,
//     private callback: (message: string) => void,
//   ) {}

//   onMessage(cb: (msg: string) => void): void {
//     this.callback = cb;
//   }
//   onError(cb: (err: Error) => void): void {
//     // throw new Error("Method not implemented.");
//   }

//   start() {
//     if (this.isOn) return;
//     this.isOn = true;

//     if (!this.roomParams.isInitiator) {
//       // Non-initiator waits before first poll
//       this.schedulePoll(NON_INITIATOR_WAIT_MS);
//     }
//     // Initiator doesn't poll until first send
//   }

//   stop() {
//     if (!this.isOn) return;

//     this.isOn = false;
//     if (this.pollTimeout) {
//       clearTimeout(this.pollTimeout);
//       this.pollTimeout = null;
//     }
//     this.sendQueue = [];
//     this.fetchQueue = [];
//   }

//   send(data: string) {
//     if (!this.isOn) return;
//     this.sendQueue.push(data);

//     // Trigger send immediately (don't wait for next poll interval)
//     if (this.pollTimeout) {
//       clearTimeout(this.pollTimeout);
//       this.pollTimeout = null;
//     }

//     this.enqueueFetch(async () => {
//       await this.pollOrSend();
//     });
//   }

//   private schedulePoll(delayMs: number) {
//     if (!this.isOn) return;

//     if (this.pollTimeout) {
//       clearTimeout(this.pollTimeout);
//     }

//     this.pollTimeout = setTimeout(() => {
//       this.enqueueFetch(async () => {
//         await this.pollOrSend();
//       });
//     }, delayMs);
//   }

//   private async enqueueFetch(fetchFn: () => Promise<void>) {
//     this.fetchQueue.push(fetchFn);
//     this.processQueue();
//   }

//   private async processQueue() {
//     if (this.isFetching || this.fetchQueue.length === 0) {
//       return;
//     }

//     this.isFetching = true;

//     try {
//       const fetchFn = this.fetchQueue.shift();
//       if (fetchFn) {
//         await fetchFn();
//       }
//     } catch (error) {
//       console.error("Signaling error:", error);
//       this.stop();
//     } finally {
//       this.isFetching = false;

//       // Process next item in queue if any
//       if (this.fetchQueue.length > 0) {
//         this.processQueue();
//       }
//     }
//   }

//   private async pollOrSend() {
//     if (!this.isOn) return;

//     try {
//       let messages: string[] = [];

//       if (this.sendQueue.length > 0) {
//         // Send queued signals and get response
//         const signalsToSend = [...this.sendQueue];
//         this.sendQueue = [];
//         messages = await this.sendApi(signalsToSend);
//       } else {
//         // Just poll for new messages
//         messages = await this.pollApi();
//       }

//       // Process received messages
//       for (const message of messages) {
//         try {
//           this.callback(message);
//         } catch (error) {
//           console.error("Error in signaling callback:", error);
//         }
//       }
//     } catch (error) {
//       // TODO: this needs display in UI
//       console.error("Polling/sending error:", error);
//     } finally {
//       // Schedule next poll
//       if (this.isOn) {
//         this.schedulePoll(POLL_INTERVAL_MS);
//       }
//     }
//   }

//   private async pollApi(): Promise<string[]> {
//     const results = await apiRead({
//       myId: this.roomParams.myId,
//       secret: this.roomParams.secret,
//     });

//     return results.map((res) => JSON.stringify(res));
//   }

//   private sendApi(signals: string[]): Promise<string[]> {
//     return apiSend({
//       myId: this.roomParams.myId,
//       peerId: this.roomParams.peerId,
//       secret: this.roomParams.secret,
//       payloads: signals,
//     });
//   }
// }
