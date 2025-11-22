import type { KVStoreRepo } from "./types";

export class KvStoreMemoryRepo implements KVStoreRepo {
  private data: Map<string, string>;

  constructor() {
    console.log("In memory store was created");
    this.data = new Map<string, string>();
  }

  async get(key: string): Promise<string | null> {
    return this.data.get(key) || null;
  }

  async set(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  }

  async delete(key: string): Promise<boolean> {
    this.data.delete(key);
    return true;
  }
}
