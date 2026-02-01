import { SingleSubscriber } from "../../utils/SingleSubscriber";
import { Signaler } from "./types";

const endpointPath = (userId: string) => `/api/signaling/${userId}`;

export class SignalingSSE implements Signaler {
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
    const url = endpointPath(this.peerId);
    try {
      const res = await fetch(url, {
        method: "POST",
        body: msg,
      });

      const body = await res.text();

      if (!res.ok) {
        if (res.status >= 400) {
          this._onError.notify(
            new ApiError(`${res.statusText}${body ? ": " + body : ""}`),
          );
        } else {
          console.log("unexpected error", { body, code: res.status });
          this._onError.notify(new Error(body));
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        // network errors mostly, or 500 from server
        this._onError.notify(err);
      } else {
        // something is too wrong
        throw err;
      }
    }
  }
}

class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}
