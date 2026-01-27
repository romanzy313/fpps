export class ReactiveValue<T> {
  constructor(private computeFn: () => T) {}

  private listeners = new Set<(value: T) => void>();

  public notifyListeners() {
    const value = this.computeFn();
    this.listeners.forEach((cb) => cb(value));
  }

  subscribe(callback: (value: T) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  dispose() {
    this.listeners.clear();
  }
}
