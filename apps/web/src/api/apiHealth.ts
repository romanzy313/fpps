import { normalizeError, tryCatch } from "@fpps/common";
import { config } from "../config";

export async function apiHealth() {
  return tryCatch(
    fetch(`${config.apiUrl}/health`).then((res) => res.ok),
    (err) => normalizeError(err).message,
  );
}
