import { describe, expect, it } from 'vitest';
import { formatVnd, matchesViSearch, normalizeVi } from './format';

describe('formatVnd', () => {
  it('formats standard VND amounts with dot thousands separators', () => {
    expect(formatVnd(0)).toBe('0 ₫');
    expect(formatVnd(75000)).toBe('75.000 ₫');
    expect(formatVnd(485000)).toBe('485.000 ₫');
    expect(formatVnd(1250000)).toBe('1.250.000 ₫');
  });

  it('handles negative, null, undefined, and decimal values safely', () => {
    expect(formatVnd(-15000)).toBe('-15.000 ₫');
    expect(formatVnd(65499.6)).toBe('65.500 ₫');
    expect(formatVnd(null)).toBe('0 ₫');
    expect(formatVnd(undefined)).toBe('0 ₫');
    expect(formatVnd(Number.NaN)).toBe('0 ₫');
  });
});

describe('normalizeVi and matchesViSearch', () => {
  it('strips Vietnamese diacritics and normalizes đ/Đ', () => {
    expect(normalizeVi('  Phở Bò Tái Lăn  ')).toBe('pho bo tai lan');
    expect(normalizeVi('Đậu Phụ Tứ Xuyên')).toBe('dau phu tu xuyen');
    expect(normalizeVi('Bún Chả Hà Nội')).toBe('bun cha ha noi');
  });

  it('matches accent-insensitive search queries on POS menu items', () => {
    expect(matchesViSearch('Phở Bò Tái Lăn', 'pho bo')).toBe(true);
    expect(matchesViSearch('Đậu Phụ Sốt Cà Chua', 'dau phu')).toBe(true);
    expect(matchesViSearch('Trà Đào Cam Sả', 'tra dao')).toBe(true);
    expect(matchesViSearch('Phở Bò Tái Lăn', 'lau thai')).toBe(false);
    expect(matchesViSearch('Nem Rán Hà Nội', '')).toBe(true);
  });
});
