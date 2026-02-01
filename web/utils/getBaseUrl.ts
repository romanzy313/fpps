export function getBaseUrl() {
  if (typeof window === "undefined") {
    // SSR, just in case
    return "";
  }

  return window.location.origin;
}
