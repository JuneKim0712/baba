'use client';

import React, { useState } from 'react';
import { Search, Bell, Sparkles, Plus, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface QuickAlertBarProps {
  onAlertCreated?: () => void;
}

export const QuickAlertBar: React.FC<QuickAlertBarProps> = ({ onAlertCreated }) => {
  const { user, signInWithGoogle } = useAuth();
  const [query, setQuery] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (!user) {
      await signInWithGoogle();
      return;
    }

    setLoading(true);

    try {
      await fetch('/api/create-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email || 'shopper@example.com',
          userId: user.uid,
          targetType: query.includes('amazon.com') || /^[A-Z0-9]{10}$/i.test(query) ? 'asin' : 'keyword',
          targetValue: query.trim(),
          productTitle: `${query.trim()} Alert`,
          targetPrice: targetPrice ? parseFloat(targetPrice) : null,
          triggerOnPredictedDrop: true
        })
      });

      setCreated(true);
      setQuery('');
      setTargetPrice('');
      if (onAlertCreated) onAlertCreated();
      setTimeout(() => setCreated(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mt-6">
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 p-1 rounded-2xl shadow-xl shadow-emerald-950/10">
        <div className="bg-white/95 backdrop-blur-md rounded-xl p-3 sm:p-4">
          <div className="flex items-center space-x-2 mb-2 text-xs font-bold text-emerald-800">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>INSTANT PRICE NOTIFIER: Type any item, category, or URL (e.g. &ldquo;hair pin&rdquo;, &ldquo;Sony XM5&rdquo;, or Amazon link)</span>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What item do you want to track? (e.g. hair pin, wireless earbuds, ASIN)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                required
              />
            </div>

            <div className="w-full sm:w-36">
              <input
                type="number"
                step="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="Target $ (opt)"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20 shrink-0"
            >
              {created ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Alert Active!</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>{loading ? 'Setting...' : 'Set Alert'}</span>
                </>
              )}
            </button>
          </form>

          {created && (
            <p className="text-xs text-emerald-700 font-semibold mt-2 animate-fade-in">
              ✓ Alert set for <strong>{query || 'your item'}</strong>! We will track Amazon every 4 hours and notify you of dips.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
