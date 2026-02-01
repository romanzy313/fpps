export class MultiSubscriber<T> {
  private subscribers: Set<(value: T) => void> = new Set();

  subscribe = (callback: (value: T) => void): (() => void) => {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  };

  notify = (value: T): void => {
    this.subscribers.forEach((callback) => callback(value));
  };

  dispose = (): void => {
    this.subscribers.clear();
  };
}
