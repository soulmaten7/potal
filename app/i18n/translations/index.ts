import { en, type TranslationKey as EnTranslationKey } from './en';
import { ko } from './ko';
import { ja } from './ja';
import { zh } from './zh';
import { es } from './es';
import { de } from './de';
import { sv } from './sv';
import { no } from './no';
import { da } from './da';
import { fi } from './fi';
import { el } from './el';
import { ro } from './ro';
import { hu } from './hu';
import { cs } from './cs';
import { sk } from './sk';
import { bg } from './bg';
import { ar } from './ar';
import { hi } from './hi';
import { bn } from './bn';
import { th } from './th';
import { vi } from './vi';
import { fa } from './fa';
import { he } from './he';
import { uk } from './uk';
import { pl } from './pl';
import { nl } from './nl';
import { fr } from './fr';
import { it } from './it';
import { pt } from './pt';
import { ru } from './ru';
import { tr } from './tr';
import { id } from './id';
import { ms } from './ms';
import { tl } from './tl';
import { sw } from './sw';
import { am } from './am';
import { ur } from './ur';
import { my } from './my';
import { km } from './km';
import { lo } from './lo';
import { ka } from './ka';
import { az } from './az';
import { uz } from './uz';
import { kk } from './kk';
import { ne } from './ne';
import { si } from './si';
import { hr } from './hr';
import { sr } from './sr';
import { lt } from './lt';
import { lv } from './lv';

export const translations = {
  en, ko, ja, zh, es, de,
  sv, no, da, fi, el, ro, hu, cs, sk, bg,
  ar, hi, bn, th, vi, fa, he, uk, pl, nl,
  fr, it, pt, ru, tr, id, ms, tl, sw, am,
  ur, my, km, lo, ka, az, uz, kk, ne, si,
  hr, sr, lt, lv,
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
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu' },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာ' },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ' },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan' },
  { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbek' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақ' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export function getTranslation(language: LanguageCode): Record<TranslationKey, string> {
  const target = translations[language] || translations[DEFAULT_LANGUAGE];
  if (language === DEFAULT_LANGUAGE) return target as Record<TranslationKey, string>;
  return { ...translations[DEFAULT_LANGUAGE], ...target } as Record<TranslationKey, string>;
}
