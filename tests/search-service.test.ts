import { describe, it, expect } from 'vitest';
import { searchProducts, VERIFIED_AMAZON_CATALOG } from '../lib/search-service';

describe('VERIFIED_AMAZON_CATALOG', () => {
  it('has unique ids', () => {
    const ids = VERIFIED_AMAZON_CATALOG.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has a unique ASIN per product', () => {
    const asins = VERIFIED_AMAZON_CATALOG.map(p => p.asin);
    expect(new Set(asins).size).toBe(asins.length);
  });

  it('links every product to its own Amazon page', () => {
    for (const p of VERIFIED_AMAZON_CATALOG) {
      expect(p.asin).toMatch(/^[A-Z0-9]{10}$/);
      expect(p.amazonUrl).toContain(`/dp/${p.asin}`);
      expect(p.isRealAmazonProduct).toBe(true);
    }
  });

  it('has sane prices, ratings and discounts', () => {
    for (const p of VERIFIED_AMAZON_CATALOG) {
      expect(p.price).toBeGreaterThan(0);
      expect(p.price).toBeLessThanOrEqual(p.originalPrice);
      expect(p.rating).toBeGreaterThanOrEqual(0);
      expect(p.rating).toBeLessThanOrEqual(5);
      expect(p.projectedDiscount).toBeGreaterThanOrEqual(0);
      expect(p.projectedDiscount).toBeLessThan(100);
    }
  });
});

describe('searchProducts', () => {
  it('ranks computer memory first for "ram"', () => {
    const results = searchProducts('ram');
    const memoryCount = VERIFIED_AMAZON_CATALOG.filter(p => p.category === 'Computer Memory').length;

    expect(memoryCount).toBeGreaterThan(0);
    for (const r of results.slice(0, memoryCount)) {
      expect(r.category).toBe('Computer Memory');
    }
  });

  it('ignores case and surrounding spaces', () => {
    expect(searchProducts('  RAM ').map(r => r.id)).toEqual(searchProducts('ram').map(r => r.id));
  });

  it('puts a product first when the query is its exact title', () => {
    const target = VERIFIED_AMAZON_CATALOG[0];
    expect(searchProducts(target.title)[0].id).toBe(target.id);
  });

  it('returns just the catalog product for an exact ASIN or Amazon URL', () => {
    const target = VERIFIED_AMAZON_CATALOG.find(p => p.id === 'ram-1')!;

    expect(searchProducts(target.asin)).toEqual([target]);
    expect(searchProducts(target.asin.toLowerCase())).toEqual([target]);
    expect(searchProducts(`https://www.amazon.com/dp/${target.asin}`)).toEqual([target]);
  });

  it('returns a single direct-lookup result for an ASIN outside the catalog', () => {
    const results = searchProducts('B000000001');

    expect(results).toHaveLength(1);
    expect(results[0].asin).toBe('B000000001');
    expect(results[0].amazonUrl).toBe('https://www.amazon.com/dp/B000000001');
  });

  it('never returns more than 15 results', () => {
    for (const q of ['ram', 'a', 'apple', 'hair', 'zzzz unknown thing']) {
      expect(searchProducts(q).length).toBeLessThanOrEqual(15);
    }
  });

  it('fills in generated suggestions for a query the catalog does not cover', () => {
    const results = searchProducts('garden hose');

    expect(results.length).toBeGreaterThan(0);
    for (const r of results.filter(x => x.id.startsWith('auto-'))) {
      expect(r.isRealAmazonProduct).toBe(false);
      expect(r.amazonUrl).toBe('https://www.amazon.com/s?k=garden%20hose');
      expect(r.price).toBeLessThanOrEqual(r.originalPrice);
    }
  });

  it('is deterministic for the same query', () => {
    expect(searchProducts('garden hose')).toEqual(searchProducts('garden hose'));
  });

  it('filters by category', () => {
    const results = searchProducts('ram', { category: 'Computer Memory' });

    expect(results.length).toBeGreaterThan(0);
    for (const r of results) expect(r.category).toBe('Computer Memory');
  });

  it('treats the "All" category as no filter', () => {
    expect(searchProducts('ram', { category: 'All' })).toEqual(searchProducts('ram'));
  });

  it('filters by price range, inclusive', () => {
    const results = searchProducts('ram', { minPrice: 50, maxPrice: 100 });

    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.price).toBeGreaterThanOrEqual(50);
      expect(r.price).toBeLessThanOrEqual(100);
    }
  });

  it('sorts by price, rating and discount', () => {
    const asc = searchProducts('ram', { sortBy: 'price_low' }).map(r => r.price);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));

    const desc = searchProducts('ram', { sortBy: 'price_high' }).map(r => r.price);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));

    const rating = searchProducts('ram', { sortBy: 'rating' }).map(r => r.rating);
    expect(rating).toEqual([...rating].sort((a, b) => b - a));

    const discount = searchProducts('ram', { sortBy: 'discount' }).map(r => r.projectedDiscount);
    expect(discount).toEqual([...discount].sort((a, b) => b - a));
  });
});
