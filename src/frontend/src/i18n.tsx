import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { LANGUAGE_LOCALES } from "@/constants";

i18n.use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        debug: true,
        fallbackLng: LANGUAGE_LOCALES,
        load: "currentOnly",
        keySeparator: ".",
        preload: false,

        interpolation: {
            escapeValue: false,
        },

        backend: {
            loadPath: "/locales/{{lng}}.json",
        },

        detection: {
            order: ["querystring", "localStorage", "navigator"],
            lookupQuerystring: "lang",
            lookupLocalStorage: "lang",
            caches: ["localStorage"],
            convertDetectedLanguage: (lng) => {
                if (!LANGUAGE_LOCALES.includes(lng)) {
                    return "en-US";
                }

                return lng;
            },
        },
    });

export default i18n;
