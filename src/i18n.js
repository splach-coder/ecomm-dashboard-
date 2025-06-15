import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translationEN from "./locales/en/translation.json";
import translationAR from "./locales/ar/translation.json";
import translationFR from "./locales/fr/translation.json";

const resources = {
  en: { translation: translationEN },
  ar: { translation: translationAR },
  fr: { translation: translationFR },
};

// Get saved language from localStorage or fallback to 'en'
const savedLang = localStorage.getItem("lang") || "en";

// Set HTML direction
const setDirection = (lang) => {
  const dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: "fr",
    interpolation: {
      escapeValue: false,
    },
  })
  .then(() => {
    setDirection(savedLang); // 👈 Set direction on init
  });

// Optional: expose function to change lang + direction
export const changeLanguage = (lang) => {
  i18n.changeLanguage(lang);
  localStorage.setItem("lang", lang);
  setDirection(lang);
};

export default i18n;