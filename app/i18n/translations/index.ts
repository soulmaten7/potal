import { en, type TranslationKey as EnTranslationKey } from './en';
import { ko } from './ko';
import { ja } from './ja';
import { zh } from './zh';
import { es } from './es';
import { de } from './de';

export const translations = {
  en,
  ko,
  ja,
  zh,
  es,
  de,
} as const;

export type LanguageCode = keyof typeof translations;
export type TranslationKey = EnTranslationKey;

export const SUPPORTED_LANGUAGES: Array<{ code: LanguageCode; name: string; nativeName: string }> = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export function getTranslation(language: LanguageCode): Record<TranslationKey, string> {
  return (translations[language] || translations[DEFAULT_LANGUAGE]) as Record<TranslationKey, string>;
}
