import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { extractAmazonContext } from '@/lib/context-dev';
import { calculatePriceProjection } from '@/lib/projection-engine';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      email,
      targetType, // 'asin' | 'category' | 'keyword'
      targetValue, // URL, ASIN, or category name
      targetPrice,
      minDiscountPercent,
      triggerOnPredictedDrop = true,
    } = body;

    if (!email || !targetValue) {
      return NextResponse.json({ error: 'Email and target product or category required' }, { status: 400 });
    }

    // Extract product details if ASIN or URL
    let productDetails = null;
    let initialProjection = null;

    if (targetType === 'asin' || targetValue.includes('amazon.com')) {
      productDetails = await extractAmazonContext(targetValue);
      initialProjection = calculatePriceProjection(productDetails.currentPrice, productDetails.category);
    }

    const alertDoc = {
      email: email.toLowerCase().trim(),
      targetType: targetType || (targetValue.includes('amazon.com') ? 'asin' : 'category'),
      targetValue: productDetails?.asin || targetValue,
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
