import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr', 'ar', 'tn'],
    defaultNS: 'common',
    ns: ['common'],
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

// Log external loading errors in development
if (import.meta.env.DEV) {
  i18n.on('failedLoading', (lng, ns, msg) => {
    console.warn(`Failed to load language: ${lng}/${ns}`, msg);
  });
}

export default i18n;