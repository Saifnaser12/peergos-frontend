/**
 * Internationalization utilities for Arabic RTL support
 */

export const rtlLanguages = ['ar', 'he', 'fa', 'ur'];

export function isRtlLanguage(language: string): boolean {
  return rtlLanguages.includes(language);
}

export function formatCurrency(amount: number, currency = 'AED', locale = 'en-AE'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(number: number, locale = 'en-AE'): string {
  return new Intl.NumberFormat(locale).format(number);
}

export function formatDate(date: Date, locale = 'en-AE'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatDateShort(date: Date, locale = 'en-AE'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function getTextDirection(language: string): 'ltr' | 'rtl' {
  return isRtlLanguage(language) ? 'rtl' : 'ltr';
}

export function getFlexDirection(language: string): 'row' | 'row-reverse' {
  return isRtlLanguage(language) ? 'row-reverse' : 'row';
}
