export class Toast {
  static error(title: string, message: string) {
    console.error(`[TOAST]: error: ${title}; ${message}`);
  }

  static success(title: string, message: string) {
    console.log(`[TOAST]: success: ${title}; ${message}`);
  }
}
