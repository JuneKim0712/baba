import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { sendPriceAlertEmail, RETAILERS, Retailer } from './email-service';

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
      const productId = alert.targetValue;

      // Extract latest price via context.dev
      let currentPrice = alert.currentPriceAtCreation || 199.99;
      try {
        const res = await fetch('https://api.context.dev/v1/extract', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${contextApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: RETAILERS[retailer].productUrl(productId),
            formats: ['json']
          })
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.price) currentPrice = json.price;
        }
      } catch (e) {
        console.warn(`[Cron] Fallback price check for ${productId}:`, e);
      }

      // Check threshold trigger
      const targetPrice = alert.targetPrice || (alert.currentPriceAtCreation ? alert.currentPriceAtCreation * 0.95 : null);

      if (targetPrice && currentPrice <= targetPrice) {
        console.log(`[Cron] Trigger condition met for alert ${doc.id}!`);
        
        await sendPriceAlertEmail({
          to: alert.email,
          productTitle: alert.productTitle || `${retailerName} Item (${productId})`,
          retailer,
          productId,
          currentPrice,
          originalPrice: alert.currentPriceAtCreation,
          projectedMid: currentPrice * 0.98,
          lowestPrice: currentPrice * 0.90,
          recommendation: 'BUY NOW',
          deltaPercentMonth: -6.5
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

export const checkAmazonDealsCron = onSchedule('every 4 hours', async (event) => {
  await checkRetailerDeals('amazon');
});

export const checkBestBuyDealsCron = onSchedule('every 4 hours', async (event) => {
  await checkRetailerDeals('bestbuy');
});
