'use client';

import React, { useState } from 'react';
import { Tag, TrendingDown, ArrowRight, Bell } from 'lucide-react';

interface DealsProps {
  onOpenAlertModal: (initialAsinOrCategory?: string) => void;
}

const FEATURED_DEALS = [
  {
    asin: 'B0CX23V258',
    title: 'Apple MacBook Air 13-inch (M3 Chip, 16GB RAM)',
    category: 'Electronics',
    currentPrice: 899.00,
    originalPrice: 1099.00,
    discountPercent: 18,
    tier: 'LOWEST',
    deltaMonth: -4.5,
    recommendation: 'BUY NOW',
    url: 'https://www.amazon.com/dp/B0CX23V258'
  },
  {
    asin: 'B09V3HN1KC',
    title: 'Logitech MX Master 3S Wireless Performance Mouse',
    category: 'Electronics',
    currentPrice: 84.99,
    originalPrice: 99.99,
    discountPercent: 15,
    tier: 'LOW',
    deltaMonth: +2.1,
    recommendation: 'BUY NOW',
    url: 'https://www.amazon.com/dp/B09V3HN1KC'
  },
  {
    asin: 'B08N5WRWNW',
    title: 'Sony PlayStation 5 Console (Slim Edition)',
    category: 'Gaming',
    currentPrice: 449.00,
    originalPrice: 499.99,
    discountPercent: 10,
    tier: 'LOW',
    deltaMonth: -8.0,
    recommendation: 'WAIT',
    url: 'https://www.amazon.com/dp/B08N5WRWNW'
  },
  {
    asin: 'B08F6XQ1N8',
    title: 'Ninja AF101 Air Fryer, 4 Qt Capacity',
    category: 'Home & Kitchen',
    currentPrice: 79.99,
    originalPrice: 129.99,
    discountPercent: 38,
    tier: 'LOWEST',
    deltaMonth: +12.0,
    recommendation: 'BUY NOW',
    url: 'https://www.amazon.com/dp/B08F6XQ1N8'
  }
];

export const LiveDealsFeed: React.FC<DealsProps> = ({ onOpenAlertModal }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredDeals = selectedCategory === 'All'
    ? FEATURED_DEALS
    : FEATURED_DEALS.filter(d => d.category === selectedCategory);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
        <div>
          <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
            <Tag className="w-4 h-4" />
            <span>Real-time Verified Drops</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Current Amazon Hot Deals
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Items currently matching our Lowest / Low quantile bounds.
          </p>
        </div>

        {/* Category Pills */}
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          {['All', 'Electronics', 'Gaming', 'Home & Kitchen'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Deals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredDeals.map(deal => (
          <div
            key={deal.asin}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  {deal.tier} TIER
                </span>
                <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                  -{deal.discountPercent}% OFF
                </span>
              </div>

              <h4 className="font-bold text-slate-800 text-sm line-clamp-2 leading-snug">
                {deal.title}
              </h4>

              <div className="mt-4 flex items-baseline space-x-2">
                <span className="text-2xl font-black text-slate-900">${deal.currentPrice.toFixed(2)}</span>
                <span className="text-xs text-slate-400 line-through">${deal.originalPrice.toFixed(2)}</span>
              </div>

              <div className="mt-2 text-xs flex items-center space-x-1.5 font-medium text-slate-500">
                <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                <span>Oracle Signal: <strong className={deal.recommendation === 'BUY NOW' ? 'text-emerald-600' : 'text-amber-600'}>{deal.recommendation}</strong></span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center space-x-2">
              <a
                href={deal.url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-center py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
              >
                View on Amazon
              </a>
              <button
                onClick={() => onOpenAlertModal(deal.asin)}
                title="Track this item"
                className="p-2 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 hover:text-emerald-600 transition"
              >
                <Bell className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
