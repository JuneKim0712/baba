export type Retailer = 'amazon' | 'bestbuy';

export const RETAILERS: Record<Retailer, { name: string; productUrl: (productId: string) => string }> = {
  amazon: {
    name: 'Amazon',
    productUrl: (asin) => `https://www.amazon.com/dp/${asin}`
  },
  bestbuy: {
    name: 'Best Buy',
    productUrl: (sku) => `https://www.bestbuy.com/site/${sku}.p?skuId=${sku}`
  }
};

export interface AlertEmailPayload {
  to: string;
  productTitle: string;
  retailer: Retailer;
  productId: string; // Amazon ASIN or Best Buy SKU
  currentPrice: number;
  originalPrice?: number;
  projectedMid: number;
  lowestPrice: number;
  recommendation: string;
  deltaPercentMonth: number;
}

export type EmailStatus = 'sent' | 'simulated' | 'failed';

export function renderAlertEmail(payload: AlertEmailPayload) {
  const retailer = RETAILERS[payload.retailer];
  const productUrl = retailer.productUrl(payload.productId);
  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="background: #10b981; padding: 12px 18px; border-radius: 12px; color: white; font-weight: bold; font-size: 14px; display: inline-block;">
        ⚡ PriceOracle Sentinel Alert
      </div>
      
      <h2 style="color: #0f172a; margin-top: 18px; font-size: 20px;">Price Drop Alert for: ${payload.productTitle}</h2>
      
      <div style="margin: 20px 0; background: #f8fafc; padding: 18px; border-radius: 12px;">
        <p style="font-size: 14px; color: #64748b; margin: 0;">Current ${retailer.name} Price</p>
        <p style="font-size: 32px; font-weight: 800; color: #0f172a; margin: 4px 0 0 0;">$${payload.currentPrice.toFixed(2)}</p>
        <p style="font-size: 13px; color: #16a34a; font-weight: bold; margin-top: 6px;">
          Oracle Recommendation: ${payload.recommendation} (Projected Floor: $${payload.lowestPrice.toFixed(2)})
        </p>
      </div>

      <p style="font-size: 14px; color: #475569; line-height: 1.5;">
        This item has entered your target discount threshold or is predicted to move. 1-Month projected change is currently <strong>${payload.deltaPercentMonth}%</strong>.
      </p>

      <div style="margin-top: 24px;">
        <a href="${productUrl}" style="background: #0f172a; color: white; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">
          View Deal on ${retailer.name} &rarr;
        </a>
      </div>

      <hr style="margin: 32px 0 16px 0; border: none; border-top: 1px solid #e2e8f0;" />
      <p style="font-size: 11px; color: #94a3b8;">
        Sent automatically by PriceOracle Alertant • Verified by context.dev & prediction markets.
      </p>
    </div>
  `;

  return {
    subject: `🔥 Price Alert: ${payload.productTitle} hit $${payload.currentPrice.toFixed(2)}`,
    html: htmlBody
  };
}

export async function sendPriceAlertEmail(payload: AlertEmailPayload): Promise<EmailStatus> {
  const apiKey = process.env.RESEND_API_KEY;
  const { subject, html } = renderAlertEmail(payload);

  if (apiKey && apiKey.startsWith('re_') && apiKey !== 're_demo_key') {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.ALERT_FROM_EMAIL || 'PriceOracle <alerts@priceoracle.app>',
          to: payload.to,
          subject,
          html
        })
      });
      if (!res.ok) {
        console.error(`[Email] Resend rejected the email (${res.status}):`, await res.text());
        return 'failed';
      }
      console.log(`[Email] Alert sent to ${payload.to}`);
      return 'sent';
    } catch (e) {
      console.error('[Email] Failed to send via Resend:', e);
      return 'failed';
    }
  } else {
    console.log(`[Email-Simulation] Dispatched simulated email to ${payload.to} for ${payload.retailer}:${payload.productId}`);
    return 'simulated';
  }
}
