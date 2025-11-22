export type Result<T, E> =
  | Readonly<[value: T, error: null]>
  | Readonly<[value: null, error: E]>;

export const Ok = <T>(value: T): Result<T, never> => [value, null] as const;

export const Err = <E>(error: E): Result<never, E> => [null, error] as const;

export const tryCatch = async <T, E>(
  promiseOrFn: Promise<T> | (() => Promise<T>),
  mapError: (error: unknown) => E,
) => {
  try {
    if (typeof promiseOrFn === "function") {
      return Ok(await promiseOrFn());
    }

    return Ok(await promiseOrFn);
  } catch (error) {
    return Err(mapError(error));
  }
};

export function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === "string") {
    return new Error(error);
  }
  if (error === null) {
    return new Error("literal 'null' error");
  }
  if (typeof error === "undefined") {
    return new Error("literal 'undefined' error");
  }
  if (typeof error === "object") {
    try {
      return new Error(JSON.stringify(error), {
        cause: error,
      });
    } catch (err) {
      return new Error(
        `Failed to stringify object... Possibly recursive: ${err};;; ${error}`,
        {
          cause: error,
        },
      );
    }
  }

  const lastAttempt = new Error(`unparseable error: ${error}`, {
    cause: error,
  });
  console.warn("error was normalized in an unparseable manner", {
    originalError: error,
    normalizedError: lastAttempt,
  });
  return lastAttempt;
}
