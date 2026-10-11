import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { sendPriceAlertEmail, RETAILERS, Retailer } from './email-service';
import { scrapeProduct } from '../../lib/context-dev';
import { calculatePriceProjection } from '../../lib/projection-engine';
import { isProductAlert, shouldTriggerAlert } from '../../lib/alert-rules';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function checkRetailerDeals(retailer: Retailer) {
  const retailerName = RETAILERS[retailer].name;
  console.log(`[Cron] Running ${retailerName} deal tracking sentinel...`);

  try {
    // Alerts created before Best Buy support carry no retailer field and are Amazon alerts
    const activeAlerts = db.collection('alerts').where('status', '==', 'active');
    const alertsSnapshot = await (retailer === 'amazon' ? activeAlerts : activeAlerts.where('retailer', '==', retailer))
      .limit(50)
      .get();

    if (alertsSnapshot.empty) {
      console.log('[Cron] No active alerts to process.');
      return;
    }

    const contextApiKey = process.env.CONTEXT_DEV_API_KEY || 'ctxt_secret_7390b0f7f788470c85aa687254599803';

    for (const doc of alertsSnapshot.docs) {
      const alert = doc.data();
      if ((alert.retailer || 'amazon') !== retailer) continue;
      if (!isProductAlert(alert)) continue;
      const productId = alert.targetValue;

      // Extract latest price via context.dev
      let currentPrice = null;
      let regularPrice = null;
      let category = null;
      try {
        const product = await scrapeProduct(RETAILERS[retailer].productUrl(productId), contextApiKey);
        if (product?.price) {
          currentPrice = product.price;
          regularPrice = product.regularPrice;
          category = product.category;
        }
      } catch (e) {
        console.warn(`[Cron] Price check failed for ${productId}:`, e);
      }

      // Never trigger on a price we could not read live
      if (!currentPrice) continue;

      // Check threshold trigger
      if (shouldTriggerAlert(alert, currentPrice, regularPrice)) {
        console.log(`[Cron] Trigger condition met for alert ${doc.id}!`);

        const projection = calculatePriceProjection(currentPrice, category || 'Electronics');

        await sendPriceAlertEmail({
          to: alert.email,
          productTitle: alert.productTitle || `${retailerName} Item (${productId})`,
          retailer,
          productId,
          currentPrice,
          originalPrice: alert.currentPriceAtCreation,
          projectedMid: projection.projectedMid,
          lowestPrice: projection.quantiles.lowest,
          recommendation: projection.recommendation,
          deltaPercentMonth: projection.deltaPercentMonth
        });

        // Mark as triggered so we don't spam
        await doc.ref.update({
          status: 'triggered',
          lastNotifiedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
  } catch (error) {
    console.error('[Cron] Error during scheduled execution:', error);
  }
}

export const checkAmazonDealsCron = onSchedule({ schedule: 'every 4 hours', timeoutSeconds: 1800 }, async (event) => {
  await checkRetailerDeals('amazon');
});

export const checkBestBuyDealsCron = onSchedule({ schedule: 'every 4 hours', timeoutSeconds: 1800 }, async (event) => {
  await checkRetailerDeals('bestbuy');
});
