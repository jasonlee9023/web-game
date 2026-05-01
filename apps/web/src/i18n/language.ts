import { ref } from 'vue';

export type SupportedLanguage = 'ko' | 'en';
export type LocalizedText = Record<SupportedLanguage, string>;

export const LANGUAGE_STORAGE_KEY = 'cgw-language';
export const SUPPORTED_LANGUAGES: Array<{ code: SupportedLanguage; label: string }> = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
];

function normalizeLanguage(value: unknown): SupportedLanguage | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.toLowerCase();
  if (normalized === 'ko' || normalized.startsWith('ko-')) {
    return 'ko';
  }
  if (normalized === 'en' || normalized.startsWith('en-')) {
    return 'en';
  }

  return null;
}

function detectBrowserLanguage(): SupportedLanguage {
  const browserLanguages = typeof navigator === 'undefined' ? [] : [...navigator.languages, navigator.language];
  return browserLanguages.map(normalizeLanguage).find(Boolean) ?? 'ko';
}

function readStoredLanguage(): SupportedLanguage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return null;
  }
}

function syncDocumentLanguage(language: SupportedLanguage) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language;
  }
}

export function resolveInitialLanguage(): SupportedLanguage {
  return readStoredLanguage() ?? detectBrowserLanguage();
}

export const currentLanguage = ref<SupportedLanguage>(resolveInitialLanguage());
syncDocumentLanguage(currentLanguage.value);

export function setLanguage(language: SupportedLanguage) {
  currentLanguage.value = language;
  syncDocumentLanguage(language);

  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Ignore storage failures in private mode.
  }

  window.dispatchEvent(new CustomEvent('cgw-language-change', { detail: { language } }));
}

export function translate(copy: LocalizedText, language = currentLanguage.value) {
  return copy[language] ?? copy.ko;
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== LANGUAGE_STORAGE_KEY) {
      return;
    }

    const nextLanguage = normalizeLanguage(event.newValue);
    if (nextLanguage) {
      currentLanguage.value = nextLanguage;
      syncDocumentLanguage(nextLanguage);
    }
  });
}
