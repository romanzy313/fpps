export class ValueSubscriber<T> {
  private _value: T;
  private subscribers: Set<(value: T) => void> = new Set();

  constructor(value: T) {
    this._value = value;
  }

  get value(): T {
    return this._value;
  }

  setValue(value: T) {
    this._value = value;
    this.subscribers.forEach((callback) => callback(value));
  }

  subscribe(callback: (value: T) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  dispose(): void {
    this.subscribers.clear();
  }
}
