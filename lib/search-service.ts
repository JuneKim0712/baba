export interface SearchProductResult {
  id: string;
  asin: string;
  title: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewsCount: number;
  category: string;
  image: string;
  amazonUrl: string;
  projectedDiscount: number;
}

const CATALOG: Record<string, SearchProductResult[]> = {
  'hair pin': [
    {
      id: 'hp-1',
      asin: 'B0892KQW7P',
      title: 'French Concord Hair Pin Curved Metal U-Shaped Chignon Pins (4-Pack)',
      price: 11.99,
      originalPrice: 15.99,
      rating: 4.6,
      reviewsCount: 3820,
      category: 'Beauty & Hair Care',
      image: 'https://images.unsplash.com/photo-1590159763121-7c9ff3149e0a?w=160&h=160&fit=crop',
      amazonUrl: 'https://www.amazon.com/dp/B0892KQW7P',
      projectedDiscount: 18
    },
    {
      id: 'hp-2',
      asin: 'B09Y8N4M3L',
      title: 'Minimalist Matte Gold & Silver Geometric Bobby Pins & Hair Clips (12-Piece)',
      price: 8.49,
      originalPrice: 12.00,
      rating: 4.5,
      reviewsCount: 1940,
      category: 'Beauty & Hair Care',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=160&h=160&fit=crop',
      amazonUrl: 'https://www.amazon.com/dp/B09Y8N4M3L',
      projectedDiscount: 25
    },
    {
      id: 'hp-3',
      asin: 'B07V2H9QLK',
      title: 'Vintage Pearl & Crystal Bridal Hair Pins Decorative Accessories (20-Pack)',
      price: 13.99,
      originalPrice: 18.99,
      rating: 4.8,
      reviewsCount: 5210,
      category: 'Beauty & Hair Care',
      image: 'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?w=160&h=160&fit=crop',
      amazonUrl: 'https://www.amazon.com/dp/B07V2H9QLK',
      projectedDiscount: 12
    }
  ],
  'airpods': [
    {
      id: 'eb-1',
      asin: 'B0CX23V258',
      title: 'Apple AirPods Pro (2nd Generation) Wireless Earbuds with USB-C MagSafe',
      price: 189.99,
      originalPrice: 249.00,
      rating: 4.7,
      reviewsCount: 14200,
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=160&h=160&fit=crop',
      amazonUrl: 'https://www.amazon.com/dp/B0CX23V258',
      projectedDiscount: 24
    },
    {
      id: 'eb-2',
      asin: 'B0C8PT6V9P',
      title: 'Sony WF-1000XM5 Industry Leading Noise Canceling Truly Wireless Earbuds',
      price: 248.00,
      originalPrice: 299.99,
      rating: 4.4,
      reviewsCount: 6810,
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=160&h=160&fit=crop',
      amazonUrl: 'https://www.amazon.com/dp/B0C8PT6V9P',
      projectedDiscount: 15
    }
  ],
  'mouse': [
    {
      id: 'ms-1',
      asin: 'B09V3HN1KC',
      title: 'Logitech MX Master 3S Wireless Performance Mouse',
      price: 84.99,
      originalPrice: 99.99,
      rating: 4.7,
      reviewsCount: 8900,
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=160&h=160&fit=crop',
      amazonUrl: 'https://www.amazon.com/dp/B09V3HN1KC',
      projectedDiscount: 15
    }
  ]
};

export function searchProductsLocally(rawQuery: string): SearchProductResult[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return [];

  // Match existing catalog
  const match = Object.keys(CATALOG).find(k => q.includes(k) || k.includes(q));
  if (match) {
    return CATALOG[match];
  }

  // Dynamic intelligent suggestion generator for any user search term
  const titleCap = q.charAt(0).toUpperCase() + q.slice(1);
  return [
    {
      id: `gen-1-${q}`,
      asin: 'B0' + Math.abs(q.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)).toString(36).substring(0, 8).toUpperCase(),
      title: `Top Rated Best-Seller ${titleCap} on Amazon (Amazon's Choice)`,
      price: 19.99,
      originalPrice: 27.99,
      rating: 4.7,
      reviewsCount: 4210,
      category: 'Amazon Best-Seller',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=160&h=160&fit=crop',
      amazonUrl: `https://www.amazon.com/s?k=${encodeURIComponent(q)}`,
      projectedDiscount: 28
    },
    {
      id: `gen-2-${q}`,
      asin: 'B09' + Math.abs(q.split('').reverse().reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)).toString(36).substring(0, 7).toUpperCase(),
      title: `Premium Multi-Pack ${titleCap} with Prime Fast Shipping`,
      price: 29.50,
      originalPrice: 35.00,
      rating: 4.5,
      reviewsCount: 1890,
      category: 'Prime Featured',
      image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=160&h=160&fit=crop',
      amazonUrl: `https://www.amazon.com/s?k=${encodeURIComponent(q)}`,
      projectedDiscount: 14
    },
    {
      id: `gen-3-${q}`,
      asin: 'B08' + Math.abs((q + 'low').split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)).toString(36).substring(0, 7).toUpperCase(),
      title: `Budget Value Pack ${titleCap} (Lowest Historical Price)`,
      price: 12.99,
      originalPrice: 16.99,
      rating: 4.4,
      reviewsCount: 920,
      category: 'Value Option',
      image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=160&h=160&fit=crop',
      amazonUrl: `https://www.amazon.com/s?k=${encodeURIComponent(q)}`,
      projectedDiscount: 22
    }
  ];
}
