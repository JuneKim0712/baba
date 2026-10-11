export interface ExtractedProductContext {
  asin: string;
  title: string;
  currentPrice: number;
  originalPrice?: number;
  category: string;
  historicalMin?: number;
  historicalMax?: number;
  isAvailable: boolean;
}

// Product fields returned by context.dev's scrape endpoint (subset we use)
export interface ScrapedProduct {
  name: string;
  price: number | null;
  regularPrice: number | null;
  category: string | null;
}

export async function scrapeProduct(url: string, apiKey: string): Promise<ScrapedProduct | null> {
  // context.dev limits how many requests run at once, so wait and retry when it answers 429
  for (let attempt = 0; ; attempt++) {
    const res = await fetch('https://api.context.dev/v1/web/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        formats: { product: true }
      })
    });

    if (res.status === 429 && attempt < 3) {
      const retryAfterSeconds = Number(res.headers.get('Retry-After')) || 2;
      await new Promise(resolve => setTimeout(resolve, Math.min(retryAfterSeconds, 10) * 1000));
      continue;
    }

    if (!res.ok) return null;

    const data = await res.json();
    return data?.product?.data?.product || null;
  }
}

// Returns null when no ASIN is found or the live price cannot be read
export async function extractAmazonContext(urlOrAsin: string): Promise<ExtractedProductContext | null> {
  const apiKey = process.env.CONTEXT_DEV_API_KEY || 'ctxt_secret_7390b0f7f788470c85aa687254599803';
  
  // Extract ASIN from string if URL
  const asinMatch = urlOrAsin.match(/(?:dp|gp\/product)\/([A-Z0-9]{10})/i) || urlOrAsin.match(/^[A-Z0-9]{10}$/i);
  if (!asinMatch) return null;
  const asin = asinMatch[1] || asinMatch[0];
  const url = `https://www.amazon.com/dp/${asin}`;

  try {
    const product = await scrapeProduct(url, apiKey);

    if (product?.price) {
      return {
        asin,
        title: product.name || 'Amazon Product',
        currentPrice: product.price,
        originalPrice: product.regularPrice || undefined,
        category: product.category || 'Electronics',
        isAvailable: true
      };
    }
  } catch (err) {
    console.warn('[context.dev] Product lookup failed', err);
  }

  return null;
}

export interface ExtractedBestBuyContext extends Omit<ExtractedProductContext, 'asin'> {
  sku: string;
}

// Returns null when no SKU is found or the live price cannot be read
export async function extractBestBuyContext(urlOrSku: string): Promise<ExtractedBestBuyContext | null> {
  const apiKey = process.env.CONTEXT_DEV_API_KEY;

  // Extract SKU from string if URL
  const skuMatch = urlOrSku.match(/(?:skuId=|\/sku\/|\/)(\d{7,8})(?:\.p)?(?:[/?&#]|$)/i) || urlOrSku.trim().match(/^\d{7,8}$/);
  if (!skuMatch) return null;
  const sku = skuMatch[1] || skuMatch[0];
  const url = `https://www.bestbuy.com/site/${sku}.p?skuId=${sku}`;

  try {
    const product = await scrapeProduct(url, apiKey);

    if (product?.price) {
      return {
        sku,
        title: product.name || 'Best Buy Product',
        currentPrice: product.price,
        originalPrice: product.regularPrice || undefined,
        category: product.category || 'Electronics',
        isAvailable: true
      };
    }
  } catch (err) {
    console.warn('[context.dev] Product lookup failed', err);
  }

  return null;
}
