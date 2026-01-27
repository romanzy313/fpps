export function secureId(): string {
  // returns a UUID for now
  return crypto.randomUUID();
}
