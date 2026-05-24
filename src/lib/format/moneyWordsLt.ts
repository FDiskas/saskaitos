import { type Money } from '@/lib/domain';

const UNITS = [
  'nulis',
  'vienas',
  'du',
  'trys',
  'keturi',
  'penki',
  'šeši',
  'septyni',
  'aštuoni',
  'devyni',
] as const;

const TEENS = [
  'dešimt',
  'vienuolika',
  'dvylika',
  'trylika',
  'keturiolika',
  'penkiolika',
  'šešiolika',
  'septyniolika',
  'aštuoniolika',
  'devyniolika',
] as const;

const TENS = [
  '',
  '',
  'dvidešimt',
  'trisdešimt',
  'keturiasdešimt',
  'penkiasdešimt',
  'šešiasdešimt',
  'septyniasdešimt',
  'aštuoniasdešimt',
  'devyniasdešimt',
] as const;

type NounForms = {
  singular: string;
  few: string;
  many: string;
};

const GROUP_FORMS: ReadonlyArray<NounForms> = [
  { singular: '', few: '', many: '' },
  { singular: 'tūkstantis', few: 'tūkstančiai', many: 'tūkstančių' },
  { singular: 'milijonas', few: 'milijonai', many: 'milijonų' },
  { singular: 'milijardas', few: 'milijardai', many: 'milijardų' },
];

const EURO_FORMS: NounForms = { singular: 'euras', few: 'eurai', many: 'eurų' };
const CENT_FORMS: NounForms = { singular: 'centas', few: 'centai', many: 'centų' };

function selectNounForm(value: number, forms: NounForms): string {
  const absolute = Math.abs(value);
  const lastTwoDigits = absolute % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return forms.many;

  const lastDigit = absolute % 10;
  if (lastDigit === 1) return forms.singular;
  if (lastDigit >= 2 && lastDigit <= 9) return forms.few;
  return forms.many;
}

function convertTriadToWords(triad: number): string {
  if (triad === 0) return '';

  const parts: string[] = [];
  const hundreds = Math.floor(triad / 100);
  const remainder = triad % 100;

  if (hundreds > 0) {
    if (hundreds === 1) {
      parts.push('šimtas');
    } else {
      parts.push(`${UNITS[hundreds]} šimtai`);
    }
  }

  if (remainder >= 10 && remainder <= 19) {
    const teenWord = TEENS[remainder - 10];
    if (teenWord) parts.push(teenWord);
    return parts.join(' ');
  }

  const tens = Math.floor(remainder / 10);
  const units = remainder % 10;

  if (tens >= 2) {
    const tenWord = TENS[tens];
    if (tenWord) parts.push(tenWord);
  }

  if (units > 0) {
    const unitWord = UNITS[units];
    if (unitWord) parts.push(unitWord);
  }

  return parts.join(' ');
}

function convertIntegerToWords(value: number): string {
  if (value === 0) return UNITS[0];

  const parts: string[] = [];
  let remainder = value;
  let groupIndex = 0;

  while (remainder > 0) {
    const triad = remainder % 1000;
    if (triad > 0) {
      const triadWords = convertTriadToWords(triad);
      const groupForms = GROUP_FORMS[groupIndex];
      const groupWord = groupForms ? selectNounForm(triad, groupForms) : '';
      const segment = [triadWords, groupWord].filter(Boolean).join(' ');
      parts.unshift(segment);
    }

    remainder = Math.floor(remainder / 1000);
    groupIndex += 1;
  }

  return parts.join(' ');
}

function capitalizeFirst(text: string): string {
  if (text.length === 0) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function moneyToWordsLt(money: Money): string {
  if (money.currency !== 'EUR') {
    return money.format('lt-LT');
  }

  const absoluteCents = Math.abs(money.toCents());
  const euros = Math.floor(absoluteCents / 100);
  const cents = absoluteCents % 100;

  const euroWords = convertIntegerToWords(euros);
  const centWords = convertIntegerToWords(cents);
  const euroNoun = selectNounForm(euros, EURO_FORMS);
  const centNoun = selectNounForm(cents, CENT_FORMS);

  const normalized = `${euroWords} ${euroNoun} ${centWords} ${centNoun}`.trim();
  const prefixed = money.isNegative() ? `minus ${normalized}` : normalized;
  return capitalizeFirst(prefixed);
}
