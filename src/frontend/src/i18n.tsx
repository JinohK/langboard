import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";
import { APP_NAME, IS_PRODUCTION, LANGUAGE_LOCALES } from "@/constants";
import { StringCase } from "@/core/utils/StringUtils";

i18n.use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        debug: !IS_PRODUCTION && false,
        fallbackLng: LANGUAGE_LOCALES,
        load: "currentOnly",
        keySeparator: ".",
        preload: false,

        interpolation: {
            escapeValue: false,
            defaultVariables: {
                app: new StringCase(APP_NAME).toPascal(),
            },
        },

        backend: {
            loadPath: "/locales/{{lng}}.json",
        },

        detection: {
            order: ["localStorage", "navigator"],
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
