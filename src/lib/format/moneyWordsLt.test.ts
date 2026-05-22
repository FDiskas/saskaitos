import { describe, expect, it } from 'vitest';
import { Money } from '@/lib/domain';
import { moneyToWordsLt } from './moneyWordsLt';

describe('moneyToWordsLt', () => {
  it('when amount is zero, then returns zero euros and zero cents in words', () => {
    expect(moneyToWordsLt(Money.zero())).toBe('Nulis eurų nulis centų');
  });

  it('when amount is singular euro and singular cent, then uses singular nouns', () => {
    expect(moneyToWordsLt(Money.fromCents(101))).toBe('Vienas euras vienas centas');
  });

  it('when amount ends with teen value, then uses many noun form', () => {
    expect(moneyToWordsLt(Money.fromCents(1113))).toBe('Vienuolika eurų trylika centų');
  });

  it('when amount has large integer part, then composes thousands and hundreds', () => {
    expect(moneyToWordsLt(Money.fromCents(12345678))).toBe(
      'Šimtas dvidešimt trys tūkstančiai keturi šimtai penkiasdešimt šeši eurai septyniasdešimt aštuoni centai',
    );
  });

  it('when amount is negative, then prefixes with minus', () => {
    expect(moneyToWordsLt(Money.fromCents(-205))).toBe('Minus du eurai penki centai');
  });

  it('when currency is not euro, then falls back to money formatter', () => {
    expect(moneyToWordsLt(Money.fromCents(1234, 'USD'))).toContain('USD');
  });
});
