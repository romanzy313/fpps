import { toast } from "react-toastify";

function format(title: string, message?: string) {
  return message ? `${title}: ${message}` : title;
}

export class Toast {
  static error(title: string, message?: string) {
    const text = format(title, message);
    toast(text, {
      type: "error",
    });
    console.error(`[TOAST]: error: ${text}`);
  }

  static success(title: string, message?: string) {
    const text = format(title, message);
    toast(text, {
      type: "success",
    });
    console.log(`[TOAST]: success: ${text}`);
  }

  static info(title: string, message?: string) {
    const text = format(title, message);
    toast(text, {
      type: "info",
    });
    console.log(`[TOAST]: info: ${text}`);
  }
}
