/**
 * F001: Multi-language product name normalization
 * Auto-detects language and normalizes to English for classification pipeline.
 */

type DetectedLang = 'ko' | 'ja' | 'zh' | 'ar' | 'ru' | 'de' | 'fr' | 'es' | 'pt' | 'en' | 'unknown';

const translationCache = new Map<string, string>();

export function detectLanguage(text: string): DetectedLang {
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  if (/[\u0400-\u04FF]/.test(text)) return 'ru';
  // Latin-based languages: check common words
  const lower = text.toLowerCase();
  if (/\b(und|der|die|das|ist|für|mit)\b/.test(lower)) return 'de';
  if (/\b(le|la|les|de|des|est|une|pour)\b/.test(lower)) return 'fr';
  if (/\b(el|la|los|las|es|un|una|para|con)\b/.test(lower)) return 'es';
  if (/\b(o|a|os|as|do|da|dos|das|para|com)\b/.test(lower)) return 'pt';
  if (/[a-zA-Z]/.test(text)) return 'en';
  return 'unknown';
}

// Common product term translations (offline dictionary for speed)
const PRODUCT_DICTIONARY: Record<string, Record<string, string>> = {
  ko: {
    '면': 'cotton', '티셔츠': 't-shirt', '신발': 'shoes', '가방': 'bag', '전자제품': 'electronics',
    '의류': 'clothing', '식품': 'food', '화장품': 'cosmetics', '액세서리': 'accessories',
    '스마트폰': 'smartphone', '노트북': 'laptop', '컴퓨터': 'computer', '시계': 'watch',
    '안경': 'glasses', '지갑': 'wallet', '벨트': 'belt', '모자': 'hat', '양말': 'socks',
  },
  ja: {
    '綿': 'cotton', 'シャツ': 'shirt', '靴': 'shoes', 'カバン': 'bag', '電子': 'electronic',
    '衣類': 'clothing', '食品': 'food', '化粧品': 'cosmetics', '時計': 'watch',
  },
  zh: {
    '棉': 'cotton', '衬衫': 'shirt', '鞋': 'shoes', '包': 'bag', '电子': 'electronic',
    '服装': 'clothing', '食品': 'food', '化妆品': 'cosmetics', '手表': 'watch', '手机': 'phone',
  },
  de: {
    'baumwolle': 'cotton', 'hemd': 'shirt', 'schuhe': 'shoes', 'tasche': 'bag',
    'elektronik': 'electronics', 'kleidung': 'clothing', 'lebensmittel': 'food',
  },
  fr: {
    'coton': 'cotton', 'chemise': 'shirt', 'chaussures': 'shoes', 'sac': 'bag',
    'électronique': 'electronics', 'vêtements': 'clothing', 'nourriture': 'food',
  },
  es: {
    'algodón': 'cotton', 'camisa': 'shirt', 'zapatos': 'shoes', 'bolsa': 'bag',
    'electrónica': 'electronics', 'ropa': 'clothing', 'alimentos': 'food',
  },
};

export async function normalizeProductName(name: string, sourceLang?: string): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;

  const cacheKey = `${sourceLang || 'auto'}:${trimmed}`;
  if (translationCache.has(cacheKey)) return translationCache.get(cacheKey)!;

  const lang = sourceLang as DetectedLang || detectLanguage(trimmed);

  if (lang === 'en' || lang === 'unknown') {
    translationCache.set(cacheKey, trimmed);
    return trimmed;
  }

  // Dictionary-based translation
  const dict = PRODUCT_DICTIONARY[lang];
  if (dict) {
    let normalized = trimmed.toLowerCase();
    for (const [foreign, english] of Object.entries(dict)) {
      normalized = normalized.replace(new RegExp(foreign, 'gi'), english);
    }
    // Keep any untranslated terms as-is (they may be brand names)
    const result = normalized.trim();
    translationCache.set(cacheKey, result);
    return result;
  }

  translationCache.set(cacheKey, trimmed);
  return trimmed;
}
