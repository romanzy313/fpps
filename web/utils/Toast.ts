import { toast, ToastOptions } from "react-toastify";

type CustomToastOptions = {
  dontAutoDismiss?: boolean;
};

// toast demo
// https://fkhadra.github.io/react-toastify/introduction/
function toLibOptions(opts?: CustomToastOptions): ToastOptions<unknown> {
  return {
    autoClose: opts?.dontAutoDismiss ? false : 5000,
  };
}
export class Toast {
  static error(text: string, opts?: CustomToastOptions) {
    toast(text, {
      ...toLibOptions(opts),
      type: "error",
    });
    console.error(`[TOAST]: error: ${text}`);
  }

  static success(text: string, opts?: CustomToastOptions) {
    toast(text, {
      ...toLibOptions(opts),
      type: "success",
    });
    console.log(`[TOAST]: success: ${text}`);
  }

  static info(text: string, opts?: CustomToastOptions) {
    toast(text, {
      ...toLibOptions(opts),

      type: "info",
    });
    console.log(`[TOAST]: info: ${text}`);
  }
}
