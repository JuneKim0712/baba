import React from 'react';
import { Sparkles, Bell, ArrowRight } from 'lucide-react';

interface NavbarProps {
  onOpenAlertModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAlertModal }) => {
  return (
    <nav className="w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">PriceOracle</span>
            <span className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Alertant</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={onOpenAlertModal}
            className="flex items-center space-x-1.5 text-sm font-semibold text-slate-700 hover:text-emerald-600 px-3 py-2 rounded-lg transition"
          >
            <Bell className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Set Price Alert</span>
          </button>
          
          <a
            href="#install-extension"
            className="flex items-center space-x-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl shadow-sm hover:shadow transition"
          >
            <span>Add to Chrome</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </nav>
  );
};
