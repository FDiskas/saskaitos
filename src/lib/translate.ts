import translations from "../locales/translations.json";

export type LanguageCode = keyof (typeof translations)[keyof typeof translations];
type PluralValue = { one: string; other: string };
type Translate = {
  [K in keyof typeof translations]: (typeof translations)[K][typeof DEFAULT_LANGUAGE] extends PluralValue
    ? (count: number) => string
    : string;
};
type TranslationParams = Record<string, string | number>;

const DEFAULT_LANGUAGE = "en" as const;

function isPlural(value: unknown): value is PluralValue {
  return Boolean(
    value &&
    typeof value === "object" &&
    "one" in value &&
    "other" in value &&
    typeof value.one === "string" &&
    typeof value.other === "string",
  );
}

function createTranslationHelper(language: LanguageCode): Translate {
  const result = {} as Record<
    keyof typeof translations,
    string | ((count: number) => string)
  >;

  for (const key of Object.keys(translations) as (keyof typeof translations)[]) {
    const baseValue = translations[key]?.[DEFAULT_LANGUAGE];
    const value = translations[key]?.[language];

    if (isPlural(baseValue)) {
      result[key] = (count: number) => {
        if (!isPlural(value)) {
          return "";
        }

        return count === 1 ? value.one : value.other;
      };
      continue;
    }

    result[key] = typeof value === "string" ? value : "";
  }

  // `Translate` maps each key to a string OR a (count) => string based on a
  // per-key conditional type. TS cannot infer that the loop above populates
  // each key with the matching variant, so the assertion is unavoidable here;
  // the runtime branch on `isPlural` guarantees the shape is correct.
  return result as unknown as Translate;
}

export const translate = createTranslationHelper(DEFAULT_LANGUAGE);

export function setTranslateLanguage(language: LanguageCode): void {
  Object.assign(translate, createTranslationHelper(language));
}

export function withParams(
  template: string,
  params?: TranslationParams,
): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_match, token: string) => {
    const value = params[token];
    return value === undefined ? `{${token}}` : String(value);
  });
}