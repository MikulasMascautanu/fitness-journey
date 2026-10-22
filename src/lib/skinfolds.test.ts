import { describe, expect, it } from 'vitest';
import referenceHtml from '../../public/reference/durnin-womersley.html?raw';
import table from './durnin-womersley-table.json';
import { ageOn } from './calculations';
import { skinfoldEstimate } from './skinfolds';

describe('Durnin–Womersley published percentage table (1974, Table 9, p. 95)', () => {
  it('keeps every cell in the static reference consistent with the calculator data', () => {
    const html = referenceHtml;
    for (const [sex, offset] of [['m', 1], ['f', 5]] as const) {
      const section = html.match(new RegExp(`<section id="${sex}">([\\s\\S]*?)</section>`))![1];
      const rows = [...section.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].filter(match => match[1].includes('<td>'));
      const values = rows.map(row => [...row[1].matchAll(/<(?:th|td)(?:\s[^>]*)?>([\s\S]*?)<\/(?:th|td)>/g)].map(cell => cell[1].trim()));
      expect(values).toEqual(table.rows.map(row => [String(row[0]), ...row.slice(offset, offset + 4).map(value => value === null ? '—' : value.toFixed(1))]));
    }
  });

  it.each([
    ['m', 18, '17–29', 19], ['m', 29, '17–29', 19],
    ['m', 30, '30–39', 21.5], ['m', 39, '30–39', 21.5],
    ['m', 40, '40–49', 24.6], ['m', 49, '40–49', 24.6],
    ['m', 50, '50+', 26.5], ['m', 120, '50+', 26.5],
    ['f', 18, '16–29', 26.5], ['f', 29, '16–29', 26.5],
    ['f', 30, '30–39', 28.2], ['f', 39, '30–39', 28.2],
    ['f', 40, '40–49', 31], ['f', 49, '40–49', 31],
    ['f', 50, '50+', 33.4], ['f', 120, '50+', 33.4],
  ] as const)('selects %s age %s column %s at 50 mm', (sex, age, ageBand, percentage) => {
    expect(skinfoldEstimate(sex, age, [10, 15, 10, 15])).toMatchObject({ percentage, sum: 50, ageBand, interpolated: false });
  });

  it('uses the age on a backdated measurement and switches bands on the birthday', () => {
    expect(skinfoldEstimate('f', ageOn('1996-06-15', '2026-06-14'), [10, 15, 10, 15]).percentage).toBe(26.5);
    expect(skinfoldEstimate('f', ageOn('1996-06-15', '2026-06-15'), [10, 15, 10, 15]).percentage).toBe(28.2);
  });

  it('interpolates between published percentages for decimal totals', () => {
    expect(skinfoldEstimate('m', 30, [10, 12.5, 15, 15])).toMatchObject({ percentage: 22, sum: 52.5, interpolated: true, lowerSum: 50, upperSum: 55 });
    expect(skinfoldEstimate('f', 29, [10, 10, 10, 17.5]).percentage).toBe(25.75);
    expect(skinfoldEstimate('m', 30, [10.1, 12.2, 13.3, 14.4]).interpolated).toBe(false);
  });

  it.each([
    ['m', 29, 15, 190, 4.8, 35.9], ['m', 30, 20, 170, 12.2, 34.8],
    ['m', 40, 20, 170, 12.2, 42], ['m', 50, 20, 170, 12.6, 46.1],
    ['f', 29, 15, 170, 10.5, 44.1], ['f', 30, 20, 200, 17, 46.5],
    ['f', 40, 20, 210, 19.8, 49.4], ['f', 50, 20, 210, 21.4, 53],
  ] as const)('respects the published range for %s age %s', (sex, age, min, max, first, last) => {
    const readings = (sum: number) => [sum / 4, sum / 4, sum / 4, sum / 4];
    expect(skinfoldEstimate(sex, age, readings(min)).percentage).toBe(first);
    expect(skinfoldEstimate(sex, age, readings(max)).percentage).toBe(last);
    expect(() => skinfoldEstimate(sex, age, readings(min - 1))).toThrow(/no estimate/);
    expect(() => skinfoldEstimate(sex, age, readings(max + 1))).toThrow(/no estimate/);
  });

  it('rejects missing sites, invalid measurements, and invalid ages', () => {
    for (const sites of [[10, 20, 15], [10, 0, 20, 10], [10, NaN, 20, 10], [101, 10, 10, 10], [10, Infinity, 10, 10], [10, 10, 10, 10, 10]]) {
      expect(() => skinfoldEstimate('m', 30, sites)).toThrow();
    }
    for (const age of [17, 121, NaN, Infinity]) expect(() => skinfoldEstimate('m', age, [10, 15, 10, 15])).toThrow();
  });
});
