// actual implementation that does json and array things

import type { KVStoreRepo } from "./types";

export class KvStore {
  constructor(private kvStore: KVStoreRepo) {
    // this.kvStore = kvStore;
  }

  async set(key: string, value: unknown): Promise<boolean> {
    try {
      const str = JSON.stringify(value);
      await this.kvStore.set(key, str);
      return true;
    } catch (error) {
      console.error(`Failed to set key ${key}: ${error}`);
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const str = await this.kvStore.get(key);
      if (str === null) return null;

      return JSON.parse(str) as T;
    } catch (error) {
      console.error(`Failed to get key ${key}: ${error}`);
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      return await this.kvStore.delete(key);
    } catch (error) {
      console.error(`Failed to delete key ${key}: ${error}`);
      return false;
    }
  }

  // null is error? hmmm
  async pop<T>(key: string): Promise<T[] | null> {
    try {
      const str = await this.kvStore.get(key);
      if (str === null) return [];

      const arr = JSON.parse(str) as unknown[];
      if (!Array.isArray(arr)) {
        throw new Error(`Expected array, got ${typeof arr}`);
      }

      await this.kvStore.delete(key);

      return arr as T[];
    } catch (error) {
      console.error(`Failed to get array for key ${key}: ${error}`);
      return null;
    }
  }

  // make sure no concurrent operations on the client happen, as kvStore operations
  // are not atomic!
  async push(
    key: string,
    value: unknown,
    opts?: {
      queueMaxSize?: number;
      ttlSeconds?: number; // TODO
    },
  ): Promise<boolean> {
    try {
      const str = await this.kvStore.get(key);

      const arr = str === null ? [] : (JSON.parse(str) as unknown[]);
      if (!Array.isArray(arr)) {
        throw new Error(`Expected array, got ${typeof arr}`);
      }

      if (opts?.queueMaxSize && arr.length >= opts.queueMaxSize) {
        throw new Error(`Array length limit exceeded`);
      }

      arr.push(value);
      await this.kvStore.set(key, JSON.stringify(arr));
      return true;
    } catch (error) {
      console.error(`Failed to append to key ${key}: ${error}`);
      return false;
    }
  }
}
