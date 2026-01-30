// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class SingleSubscriber<T extends (...args: any) => void> {
  private _cb: T | null = null;

  subscribe = (cb: T): void => {
    this._cb = cb;
  };

  subscribeOnce = (cb: T): void => {
    if (this._cb) {
      throw new Error("Already subscribed");
    }
    this._cb = cb;
  };

  notify(...args: Parameters<T>): boolean {
    if (!this._cb) {
      return false;
    }

    this._cb(...args);
    return true;
  }

  notifyMust(...args: Parameters<T>): void {
    if (!this._cb) {
      throw new Error("Not subscribed");
    }
    this._cb(...args);
  }
}
