import { useEffect } from "preact/hooks";

export function usePreventNavigation(
  message: string,
  enabled: boolean = true,
): void {
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent): string => {
      event.preventDefault();

      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [message, enabled]);
}
