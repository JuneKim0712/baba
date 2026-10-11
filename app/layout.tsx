import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PriceOracle Alertant — Amazon Buy-Timing & Automated Deal Alerts',
  description: 'AI-powered price timing and predictive alerts for Amazon shoppers. 5-tier quantile price forecasts powered by context.dev.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
