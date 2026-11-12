import { AsYouType, getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js/max';

export const DEFAULT_PHONE_COUNTRY = 'BW';

const regionDisplayNames = typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function'
  ? new Intl.DisplayNames(['en'], { type: 'region' })
  : null;

const phoneCountrySet = new Set(getCountries());

export const getCountryName = (countryCode) => {
  if (!countryCode) return '';
  return regionDisplayNames?.of(countryCode) || countryCode;
};

export const getPhoneCountries = () => getCountries()
  .map((code) => ({
    code,
    name: getCountryName(code),
    callingCode: `+${getCountryCallingCode(code)}`,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const inferCountryFromLocale = (locale) => {
  if (!locale || typeof locale !== 'string') return DEFAULT_PHONE_COUNTRY;
  const normalized = locale.replace('_', '-').toUpperCase();
  const parts = normalized.split('-');
  const region = parts.find((part) => /^[A-Z]{2}$/.test(part));
  return region && phoneCountrySet.has(region) ? region : DEFAULT_PHONE_COUNTRY;
};

export const getDefaultPhoneCountry = () => {
  if (typeof navigator !== 'undefined') {
    const localeCandidates = [navigator.language, ...(navigator.languages || [])].filter(Boolean);
    for (const locale of localeCandidates) {
      const country = inferCountryFromLocale(locale);
      if (country) return country;
    }
  }

  if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const country = inferCountryFromLocale(locale);
    if (country) return country;
  }

  return DEFAULT_PHONE_COUNTRY;
};

export const parsePhone = (value, defaultCountry = DEFAULT_PHONE_COUNTRY) => {
  if (!value) return undefined;

  const raw = String(value).trim();
  if (!raw) return undefined;

  const parsed = parsePhoneNumberFromString(raw, defaultCountry);
  if (parsed) return parsed;

  const compact = raw.replace(/[^\d+]/g, '');
  if (!compact) return undefined;

  return parsePhoneNumberFromString(compact, defaultCountry);
};

export const normalizePhoneNumber = (value, defaultCountry = DEFAULT_PHONE_COUNTRY) => {
  if (!value) return '';

  const raw = String(value).trim();
  if (!raw) return '';

  const typed = new AsYouType(defaultCountry);
  typed.input(raw);

  return typed.getNumberValue() || parsePhone(raw, defaultCountry)?.number || raw;
};

export const formatPhoneDisplay = (value, defaultCountry = DEFAULT_PHONE_COUNTRY) => {
  if (!value) return '';

  const parsed = parsePhone(value, defaultCountry);
  if (parsed) return parsed.formatInternational();

  const normalized = String(value).trim();
  return normalized;
};

export const getPhoneCountry = (value, defaultCountry = DEFAULT_PHONE_COUNTRY) => {
  const parsed = parsePhone(value, defaultCountry);
  return parsed?.country || defaultCountry;
};

export const isValidPhoneNumber = (value, defaultCountry = DEFAULT_PHONE_COUNTRY) => {
  const parsed = parsePhone(value, defaultCountry);
  return Boolean(parsed?.isValid());
};
