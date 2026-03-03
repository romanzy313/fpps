import { Toast } from "./utils/Toast";

function displayUnhandledErrors() {
  window.addEventListener("error", (event) => {
    const message = event.error?.message || "Unknown error";
    Toast.error("Unhandled error", message);
  });
}

if (typeof window !== "undefined") {
  displayUnhandledErrors();
}
