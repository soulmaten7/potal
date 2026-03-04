export {
  translations,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  getTranslation,
  type LanguageCode,
  type TranslationKey,
} from './translations';

// useI18n is exported from the I18nProvider context
// Import it directly from there or use the hook as shown below
export { useI18n } from '@/app/context/I18nProvider';
export type { I18nContextValue } from '@/app/context/I18nProvider';
