'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { searchProducts, SearchProductResult, SearchFilterOptions } from '@/lib/search-service';
import { useAuth } from '@/lib/auth-context';
import {
  Search,
  Bell,
  Star,
  ExternalLink,
  Check,
  Loader2,
  SlidersHorizontal,
  TrendingDown,
  ShieldCheck,
  Sparkles,
  ChevronRight
} from 'lucide-react';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || 'ram';

  const { user, signInWithGoogle } = useAuth();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
  const latestSearch = useRef(0);

  // Filters and Sort State
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'relevance' | 'price_low' | 'price_high' | 'discount' | 'rating'>('relevance');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  // Tracking State
  const [settingAlertId, setSettingAlertId] = useState<string | null>(null);
  const [successAlertId, setSuccessAlertId] = useState<string | null>(null);
  const [failedAlertId, setFailedAlertId] = useState<string | null>(null);

  const executeSearch = (searchTerm: string) => {
    setLoading(true);
    const filterOptions: SearchFilterOptions = {
      category: categoryFilter,
      sortBy,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    };

    const searchId = ++latestSearch.current;

    setTimeout(() => {
      const items = searchProducts(searchTerm || 'ram', filterOptions);
      setResults(items);
      setLoading(false);
    }, 120);

    // Real Amazon and Best Buy listings for the query. They carry no price or category yet,
    // so they are only merged in when no filter or sort is applied.
    const term = searchTerm.trim();
    const unfiltered = categoryFilter === 'All' && sortBy === 'relevance' && !minPrice && !maxPrice;
    if (term.length < 3 || !unfiltered) {
      setLiveLoading(false);
      return;
    }

    setLiveLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(term)}`)
      .then(res => (res.ok ? res.json() : { results: [] }))
      .then(data => {
        if (searchId !== latestSearch.current) return;
        const liveResults: SearchProductResult[] = (data.results || []).map((r: any) => ({
          id: `live-${r.retailer}-${r.productId}`,
          asin: r.productId,
          title: r.title,
          description: r.description,
          price: 0,
          originalPrice: 0,
          rating: 0,
          reviewsCount: 0,
          category: 'Live listing',
          image: '',
          amazonUrl: r.url,
          projectedDiscount: 0,
          isRealAmazonProduct: r.retailer === 'amazon',
          retailer: r.retailer === 'bestbuy' ? 'Best Buy' : 'Amazon',
          isLiveResult: true
        }));
        if (liveResults.length === 0) return;
        // Real listings first, then catalog matches; invented suggestions are dropped
        const liveIds = new Set(liveResults.map(r => r.asin));
        setResults(current => [
          ...liveResults,
          ...current.filter(r => !r.isLiveResult && !r.id.startsWith('auto-') && !liveIds.has(r.asin))
        ].slice(0, 15));
      })
      .catch(() => {})
      .finally(() => {
        if (searchId === latestSearch.current) setLiveLoading(false);
      });
  };

  useEffect(() => {
    executeSearch(query);
  }, [categoryFilter, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleSetAlert = async (product: SearchProductResult) => {
    if (!user) {
      await signInWithGoogle();
      return;
    }

    setSettingAlertId(product.id);

    try {
      const res = await fetch('/api/create-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email || 'shopper@example.com',
          userId: user.uid,
          targetType: 'asin',
          targetValue: product.isLiveResult ? product.amazonUrl : product.asin,
          productTitle: product.title,
          targetPrice: product.price ? Number((product.price * 0.9).toFixed(2)) : null,
          triggerOnPredictedDrop: true,
        }),
      });
      if (!res.ok) throw new Error('Alert was not saved');
      const saved_alert = (await res.json()).alert || {};

      const saved = localStorage.getItem('price_oracle_alerts');
      const existing = saved ? JSON.parse(saved) : [];
      const newAlert = {
        id: `alert-${Date.now()}`,
        targetType: 'asin',
        targetValue: product.asin,
        productTitle: product.title,
        currentPriceAtCreation: saved_alert.currentPriceAtCreation || product.price,
        targetPrice: product.price ? Number((product.price * 0.9).toFixed(2)) : null,
        triggerOnPredictedDrop: true,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('price_oracle_alerts', JSON.stringify([newAlert, ...existing]));

      setSuccessAlertId(product.id);
      setTimeout(() => setSuccessAlertId(null), 4000);
    } catch (err) {
      setFailedAlertId(product.id);
      setTimeout(() => setFailedAlertId(null), 4000);
      console.error(err);
    } finally {
      setSettingAlertId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-8">
          <div className="max-w-3xl">
            <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Multi-Store Amazon Product Intelligence</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Amazon Product Search &amp; Price Oracle
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Showing top verified Amazon results with 30-day price drop predictions and direct tracking buttons.
            </p>
          </div>

          {/* Search Bar Input */}
          <form onSubmit={handleSearchSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products (e.g. DDR4 RAM, hair pin, AirPods Pro, MacBook)..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-base font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition flex items-center justify-center space-x-2 shadow-md shadow-slate-900/10 shrink-0"
            >
              <span>Search Products</span>
            </button>
          </form>

          {/* Quick Filter Tag Buttons */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-400">Popular Queries:</span>
            {['ram', 'hair pin', 'airpods', 'logitech mouse', 'mechanical keyboard', 'macbook air'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setQuery(tag);
                  executeSearch(tag);
                }}
                className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                  query.toLowerCase() === tag
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Filters and Controls Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-700">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            <span>Found {results.length} Verified Options for &ldquo;{query}&rdquo;</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Category Filter */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-semibold">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="All">All Categories</option>
                <option value="Memory">Computer Memory / RAM</option>
                <option value="Beauty">Beauty &amp; Hair Care</option>
                <option value="Electronics">Electronics &amp; Audio</option>
                <option value="Computers">Computers &amp; Laptops</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-semibold">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="relevance">Highest Relevance</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="discount">Biggest Predicted Drop (%)</option>
                <option value="rating">Top Customer Rating</option>
              </select>
            </div>
          </div>
        </div>

        {liveLoading && !loading && (
          <p className="mb-4 flex items-center space-x-2 text-xs font-semibold text-slate-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            <span>Checking Amazon and Best Buy for live listings...</span>
          </p>
        )}

        {/* Top 10+ Detailed Results List */}
        {loading ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-200">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-3" />
            <p className="text-slate-600 font-bold text-base">Gathering real-time Amazon pricing &amp; specs...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-200">
            <p className="text-slate-500 font-semibold">No products found matching your search. Try another term or reset filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {results.map((product, index) => {
              const isSetting = settingAlertId === product.id;
              const isSuccess = successAlertId === product.id;
              const isFailed = failedAlertId === product.id;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  {/* Left: Thumbnail & Rank */}
                  <div className="flex items-start space-x-5 flex-1 min-w-0">
                    <div className="relative shrink-0">
                      <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-md">
                        {index + 1}
                      </span>
                      {product.image && <img
                        src={product.image}
                        alt={product.title}
                        className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl border border-slate-200 shadow-sm"
                      />}
                    </div>

                    {/* Middle: Detailed Specifications & Information */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {product.retailer === 'Best Buy' ? 'SKU' : 'ASIN'}: {product.asin}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {product.category}
                        </span>
                        {!product.isLiveResult && <div className="flex items-center text-xs text-amber-500 font-bold space-x-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{product.rating}</span>
                          <span className="text-slate-400 font-medium">({product.reviewsCount.toLocaleString()} reviews)</span>
                        </div>}
                      </div>

                      <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug">
                        {product.title}
                      </h3>

                      <p className="mt-1.5 text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>

                      {/* Specs Tags */}
                      {product.specs && product.specs.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {product.specs.map((spec, i) => (
                            <span
                              key={i}
                              className="text-[11px] font-semibold bg-slate-50 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200/80"
                            >
                              • {spec}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Pricing & Action Controls */}
                  <div className="w-full md:w-auto flex md:flex-col items-center md:items-end justify-between pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 gap-3 shrink-0">
                    {product.isLiveResult ? (
                      <p className="text-left md:text-right text-xs font-semibold text-slate-500 max-w-[14rem]">
                        Live {product.retailer} listing. The current price is read when you set an alert.
                      </p>
                    ) : (
                    <div className="text-left md:text-right">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.originalPrice > product.price && (
                          <span className="text-sm text-slate-400 line-through">
                            ${product.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center space-x-1 text-xs font-bold text-rose-600">
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>-{product.projectedDiscount}% expected drop in 30 days</span>
                      </div>
                    </div>
                    )}

                    <div className="flex items-center space-x-2">
                      {/* Accurate Amazon Link */}
                      <a
                        href={product.amazonUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 font-semibold text-xs transition flex items-center space-x-1"
                        title={`Open on ${product.retailer || 'Amazon'}`}
                      >
                        <span>View on {product.retailer || 'Amazon'}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </a>

                      {/* Side Set Alert Button */}
                      <button
                        onClick={() => handleSetAlert(product)}
                        disabled={isSetting || isSuccess}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition shadow-sm ${
                          isSuccess
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isSetting
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : isFailed
                            ? 'bg-rose-50 text-rose-700 border border-rose-300'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:shadow'
                        }`}
                      >
                        {isSuccess ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-700" />
                            <span>Alert Active!</span>
                          </>
                        ) : isSetting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Setting...</span>
                          </>
                        ) : (
                          <>
                            <Bell className="w-4 h-4" />
                            <span>{isFailed ? 'Not saved. Retry' : 'Set Alert'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center space-x-2 text-emerald-600 font-bold">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading Amazon Search Intelligence...</span>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
