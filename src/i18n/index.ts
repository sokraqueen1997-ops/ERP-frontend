import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './locales/ar.json';
import en from './locales/en.json';

const STORAGE_KEY = 'erp-language';
const savedLanguage = localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'ar';

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: savedLanguage,
  fallbackLng: 'ar',
  interpolation: { escapeValue: false },
});

function applyDocumentDirection(lang: string) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

export function setLanguage(lang: 'ar' | 'en') {
  i18n.changeLanguage(lang);
  localStorage.setItem(STORAGE_KEY, lang);
  applyDocumentDirection(lang);
}

// Apply on initial load too, since the page may have started in the "wrong" dir before JS ran.
applyDocumentDirection(savedLanguage);

export default i18n;
