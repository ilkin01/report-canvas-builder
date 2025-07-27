
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import az from '../locales/az.json';
import en from '../locales/en.json';
import ru from '../locales/ru.json';

const resources = {
  az: { translation: az },
  en: { translation: en },
  ru: { translation: ru },
};

// localStorage'dan dil al, yoksa default 'az'
const savedLanguage = localStorage.getItem('appLanguage') || 'az';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage, // localStorage'dan alınan dil
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Dil değiştiğinde localStorage'a yaz
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('appLanguage', lng);
});

export default i18n;
