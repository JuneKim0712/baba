import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { extractAmazonContext, extractBestBuyContext } from '../../lib/context-dev';
import { calculatePriceProjection } from '../../lib/projection-engine';
import { runAlertCheck } from './tracker-cron';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export const createAlert = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const {
      email,
      userId,
      targetType, // 'asin' | 'sku' | 'category' | 'keyword'
      targetValue, // URL, ASIN, Best Buy SKU, or category name
      targetPrice,
      minDiscountPercent,
      triggerOnPredictedDrop = true,
    } = req.body || {};

    if (!email || !targetValue) {
      res.status(400).json({ error: 'Email and target product or category required' });
      return;
    }

    // Extract product details if ASIN, SKU, or URL
    let productDetails = null;
    let productId = null;
    let retailer = null;
    let initialProjection = null;

    // Best Buy SKUs are 7-8 digits, so a bare one can never be mistaken for a 10-character ASIN
    const isBestBuy = targetType === 'sku' || targetValue.includes('bestbuy.com') || /^\d{7,8}$/.test(targetValue.trim());

    const isAmazon = !isBestBuy && (targetType === 'asin' || targetValue.includes('amazon.com'));

    if (isBestBuy) {
      const bestBuyDetails = await extractBestBuyContext(targetValue);
      productDetails = bestBuyDetails;
      productId = bestBuyDetails?.sku;
      retailer = 'bestbuy';
    } else if (isAmazon) {
      const amazonDetails = await extractAmazonContext(targetValue);
      productDetails = amazonDetails;
      productId = amazonDetails?.asin;
      retailer = 'amazon';
    }

    if ((isBestBuy || isAmazon) && !productDetails) {
      res.status(422).json({ success: false, error: 'Could not read a live price for that product. Check the link, ASIN, or SKU and try again.' });
      return;
    }

    if (productDetails) {
      initialProjection = calculatePriceProjection(productDetails.currentPrice, productDetails.category);
    }

    const alertDoc = {
      email: email.toLowerCase().trim(),
      userId: userId || null,
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

    const docRef = await db.collection('alerts').add(alertDoc);
    res.json({ success: true, alertId: docRef.id, alert: alertDoc });
  } catch (err: any) {
    console.error('Alert creation error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export const subscribe = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { email, source = 'landing_hero' } = req.body || {};

    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Valid email required' });
      return;
    }

    const subscriberData = {
      email: email.toLowerCase().trim(),
      source,
      createdAt: new Date().toISOString(),
      active: true,
    };

    await db.collection('subscribers').doc(email.toLowerCase().trim()).set(subscriberData, { merge: true });

    res.json({ success: true, message: 'Subscribed to hot deal alerts!' });
  } catch (err: any) {
    console.error('Subscription error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Runs the scheduled price check for one alert right now. Disabled unless DEMO_TOKEN is set,
// and every call must present it, because each check spends context.dev credits.
export const runAlertCheckNow = onRequest({ timeoutSeconds: 300 }, async (req, res) => {
  const token = process.env.DEMO_TOKEN;
  if (!token || req.get('x-demo-token') !== token) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { alertId } = req.body || {};

    if (!alertId) {
      res.status(400).json({ error: 'alertId required' });
      return;
    }

    res.json({ success: true, result: await runAlertCheck(alertId) });
  } catch (err: any) {
    console.error('Alert check error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
