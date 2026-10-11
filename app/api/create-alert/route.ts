import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { extractAmazonContext, extractBestBuyContext } from '@/lib/context-dev';
import { calculatePriceProjection } from '@/lib/projection-engine';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      email,
      targetType, // 'asin' | 'sku' | 'category' | 'keyword'
      targetValue, // URL, ASIN, Best Buy SKU, or category name
      targetPrice,
      minDiscountPercent,
      triggerOnPredictedDrop = true,
    } = body;

    if (!email || !targetValue) {
      return NextResponse.json({ error: 'Email and target product or category required' }, { status: 400 });
    }

    // Extract product details if ASIN, SKU, or URL
    let productDetails = null;
    let productId = null;
    let retailer = null;
    let initialProjection = null;

    // Best Buy SKUs are 7-8 digits, so a bare one can never be mistaken for a 10-character ASIN
    const isBestBuy = targetType === 'sku' || targetValue.includes('bestbuy.com') || /^\d{7,8}$/.test(targetValue.trim());

    if (isBestBuy) {
      const bestBuyDetails = await extractBestBuyContext(targetValue);
      productDetails = bestBuyDetails;
      productId = bestBuyDetails.sku;
      retailer = 'bestbuy';
    } else if (targetType === 'asin' || targetValue.includes('amazon.com')) {
      const amazonDetails = await extractAmazonContext(targetValue);
      productDetails = amazonDetails;
      productId = amazonDetails.asin;
      retailer = 'amazon';
    }

    if (productDetails) {
      initialProjection = calculatePriceProjection(productDetails.currentPrice, productDetails.category);
    }

    const alertDoc = {
      email: email.toLowerCase().trim(),
      targetType: isBestBuy ? 'sku' : targetType || (targetValue.includes('amazon.com') ? 'asin' : 'category'),
      targetValue: productId || targetValue,
      retailer,
      productTitle: productDetails?.title || `Alert on ${targetValue}`,
      currentPriceAtCreation: productDetails?.currentPrice || null,
      targetPrice: targetPrice ? Number(targetPrice) : null,
      minDiscountPercent: minDiscountPercent ? Number(minDiscountPercent) : null,
      triggerOnPredictedDrop,
      initialProjection: initialProjection || null,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    if (adminDb) {
      const docRef = await adminDb.collection('alerts').add(alertDoc);
      return NextResponse.json({ success: true, alertId: docRef.id, alert: alertDoc });
    }

    return NextResponse.json({
      success: true,
      alertId: 'mock-alert-' + Date.now(),
      alert: alertDoc,
      message: 'Alert configured successfully! Monitoring started.',
    });
  } catch (err: any) {
    console.error('Alert creation error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
