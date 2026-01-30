import en from "./lang/en";

export type TranslationKeys = keyof typeof en;

export function t(key: TranslationKeys): string {
  const value = en[key];

  if (!value) {
    throw new Error(`Bad translation for key '${key}'`);
  }

  return value;
}
