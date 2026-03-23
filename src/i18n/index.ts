import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from "./config";
import en from "./locales/en.json";
import ptBR from "./locales/pt-BR.json";

// Validate the stored language against the supported list to prevent
// untrusted localStorage values from reaching i18next.
const rawLang = localStorage.getItem("fc_lang") ?? "";
const saved: string = (SUPPORTED_LANGUAGES as readonly string[]).includes(rawLang)
  ? rawLang
  : DEFAULT_LANGUAGE;

i18n.use(initReactI18next).init({
  resources: { "pt-BR": { translation: ptBR }, en: { translation: en } },
  lng: saved,
  fallbackLng: "pt-BR",
  // escapeValue: false is correct for react-i18next — React's JSX rendering
  // already escapes interpolated values. Never pass t() results to
  // dangerouslySetInnerHTML or innerHTML; always render them in JSX.
  interpolation: { escapeValue: false },
});

export default i18n;
