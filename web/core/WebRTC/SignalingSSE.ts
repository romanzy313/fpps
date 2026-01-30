import { SingleSubscriber } from "../../utils/SingleSubscriber";
import { Signaling } from "./REWORK";

const endpointPath = (userId: string) => `/api/signaling2/${userId}`;

export class SignalingSSE implements Signaling {
  private _onMessage = new SingleSubscriber<(msg: string) => void>();
  private _onError = new SingleSubscriber<(err: Error) => void>();
  private es: EventSource | null = null;

  constructor(
    private myId: string,
    private peerId: string,
  ) {}

  start(): void {
    if (this.es) {
      throw new Error("Already started");
    }

    this.es = new EventSource(endpointPath(this.myId));
    this.es.onerror = () => {
      if (this.es) {
        if (this.es.readyState === EventSource.CONNECTING) {
          // this is a temporary connection issue
          console.warn("reconnecting to signaling");
        }

        // or it could be closed
      }
    };
    this.es.onmessage = (ev) => {
      const msg = ev.data as string;

      this._onMessage.notifyMust(msg);
    };
  }
  stop(): void {
    this.es?.close();
    this.es = null;
  }

  onMessage = this._onMessage.subscribe;
  onError = this._onError.subscribe;

  send(msg: string): void {
    this._send(msg);
  }

  private async _send(msg: string) {
    try {
      const res = await fetch(endpointPath(this.peerId), {
        method: "POST",
        body: msg,
      });

      const body = await res.text();

      if (!res.ok) {
        this._onError.notify(new Error(body));
      }
    } catch (err) {
      if (err instanceof Error) {
        // network errors mostly, or 500 from server
        this._onError.notify(new Error(err.message));
      } else {
        // something is too wrong
        throw err;
      }
    }
  }
}
