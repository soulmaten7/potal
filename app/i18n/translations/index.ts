import { en, type TranslationKey as EnTranslationKey } from './en';
import { ko } from './ko';

export const translations = {
  en,
  ko,
} as const;

export type LanguageCode = keyof typeof translations;
export type TranslationKey = EnTranslationKey;

export const SUPPORTED_LANGUAGES: Array<{ code: LanguageCode; name: string; nativeName: string }> = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export function getTranslation(language: LanguageCode): Record<TranslationKey, string> {
  return (translations[language] || translations[DEFAULT_LANGUAGE]) as Record<TranslationKey, string>;
}
