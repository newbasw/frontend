import { describe, expect, it } from 'vitest';
import {
  cardSpecs,
  formatDate,
  formatHours,
  formatMileage,
  formatNumber,
  formatPower,
  formatPrice,
  formatWeight,
  humanizeSlug,
  pdpHeadSpecs,
} from './format';

describe('price formatting', () => {
  it('renders euros in the reference format', () => {
    expect(formatPrice(5390000)).toBe('€ 53,900');
    expect(formatPrice(0)).toBe('€ 0');
  });

  it('returns null when there is no price', () => {
    expect(formatPrice(null)).toBeNull();
    expect(formatPrice(undefined)).toBeNull();
  });

  it('rounds sub-cent noise away', () => {
    expect(formatPrice(5390050)).toBe('€ 53,901');
  });
});

describe('measurement formatting', () => {
  it('formats mileage with a thousands separator', () => {
    expect(formatMileage(790000)).toBe('790,000 km');
    expect(formatMileage(0)).toBe('0 km');
    expect(formatMileage(null)).toBeNull();
  });

  it('formats operating hours', () => {
    expect(formatHours(8200)).toBe('8,200 h');
  });

  it('formats engine power', () => {
    expect(formatPower(500)).toBe('500 hp');
    expect(formatPower(null)).toBeNull();
  });

  it('formats weights', () => {
    expect(formatWeight(33000)).toBe('33,000 kg');
  });

  it('formats plain numbers', () => {
    expect(formatNumber(1222)).toBe('1,222');
  });

  it('formats dates as DD-MM-YYYY', () => {
    expect(formatDate('2019-01-01T00:00:00.000Z')).toBe('01-01-2019');
    expect(formatDate('not-a-date')).toBeNull();
    expect(formatDate(null)).toBeNull();
  });
});

describe('card spec chips', () => {
  it('produces brand, year, mileage, transmission, euro norm', () => {
    expect(
      cardSpecs({
        brand: { label: 'Scania' },
        registration_year: 2019,
        mileage_km: 790000,
        transmission: 'Automatic',
        emission_norm: 'Euro 6',
      }),
    ).toEqual(['Scania', '2019', '790,000 km', 'Automatic', 'Euro 6']);
  });

  it('falls back to operating hours when there is no mileage', () => {
    expect(
      cardSpecs({
        brand: { label: 'Caterpillar' },
        registration_year: 2018,
        mileage_km: null,
        operating_hours: 6400,
      }),
    ).toEqual(['Caterpillar', '2018', '6,400 h']);
  });

  it('drops missing values instead of rendering blanks', () => {
    expect(cardSpecs({ brand: null, registration_year: null })).toEqual([]);
  });
});

describe('PDP head chips', () => {
  it('matches the reference order: hp, mileage, year, norm, transmission', () => {
    expect(
      pdpHeadSpecs({
        engine_hp: 500,
        mileage_km: 790000,
        registration_year: 2019,
        emission_norm: 'Euro 6',
        transmission: 'Automatic',
      }),
    ).toEqual(['500 hp', '790,000 km', '2019', 'Euro 6', 'Automatic']);
  });
});

describe('humanizeSlug', () => {
  it('turns a slug into a readable label', () => {
    expect(humanizeSlug('light_commercial_vehicle')).toBe('Light commercial vehicle');
    expect(humanizeSlug('crane_truck')).toBe('Crane truck');
    expect(humanizeSlug('semi-trailer')).toBe('Semi trailer');
  });
});
