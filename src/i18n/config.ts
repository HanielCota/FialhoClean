// To switch default language, change this one value:
export const DEFAULT_LANGUAGE = "pt-BR" as const;
export const SUPPORTED_LANGUAGES = ["pt-BR", "en"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
