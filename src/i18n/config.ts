
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import az from '../locales/az.json';
import en from '../locales/en.json';
import tr from '../locales/tr.json';
import ru from '../locales/ru.json';

const resources = {
  az: { translation: az },
  en: { translation: en },
  tr: { translation: tr },
  ru: { translation: ru },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'az', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
