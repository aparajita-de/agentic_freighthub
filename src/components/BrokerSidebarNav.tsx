import React from 'react';
import {
  Building,
  Sliders,
  FileText,
  Ship,
  DollarSign,
  Briefcase,
  Compass,
  Percent,
  Globe,
  Radar
} from 'lucide-react';

export type BrokerTab = 'overview' | 'margin-calculator' | 'client-quotes' | 'carrier-rates' | 'commission-ledger' | 'm1-routes' | 'm2-quotes' | 'tracking';

interface BrokerSidebarNavProps {
  activeTab: BrokerTab;
  onSelectTab: (tab: BrokerTab) => void;
  quotationsCount: number;
}

interface NavItem {
  id: BrokerTab;
  label: string;
  subLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
  highlight?: boolean;
}

export const BrokerSidebarNav: React.FC<BrokerSidebarNavProps> = ({
  activeTab,
  onSelectTab,
  quotationsCount,
}) => {
  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Broker Dashboard',
      subLabel: 'KPIs & volume overview',
      icon: Building,
    },
    {
      id: 'tracking',
      label: 'Shipment Tracking',
      subLabel: 'Real-time cargo & fleet status',
      icon: Globe,
    },
    {
      id: 'm1-routes',
      label: 'Route Operations',
      subLabel: 'Transit & corridor optimizer',
      icon: Compass,
    },
    {
      id: 'm2-quotes',
      label: 'Broker Quotations',
      subLabel: 'Commercial pricing desk',
      icon: Percent,
    },
    {
      id: 'margin-calculator',
      label: 'Margin Studio',
      subLabel: 'Dynamic margin & quote generator',
      icon: Sliders,
      highlight: true,
    },
    {
      id: 'client-quotes',
      label: 'Client Quotes',
      subLabel: 'Review & approve shipper quotes',
      icon: FileText,
      badge: quotationsCount,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
    },
    {
      id: 'carrier-rates',
      label: 'Carrier Spot Rates',
      subLabel: 'Tier-1 carrier spot matrix',
      icon: Ship,
      badge: '6 Lines',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      id: 'commission-ledger',
      label: 'Commission Ledger',
      subLabel: 'Settlement logs & payout records',
      icon: DollarSign,
      badge: 'Live',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Broker Left Navigation Menu */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between px-2 text-[10px] font-black text-amber-600 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Briefcase className="w-3.5 h-3.5" />
            <span>BROKER NAVIGATION</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-[#0F172A] text-white shadow-md shadow-slate-900/20'
                    : 'text-slate-700 hover:bg-amber-50/60 hover:text-slate-950'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : item.highlight
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="font-extrabold truncate">{item.label}</div>
                    {item.subLabel && (
                      <div
                        className={`text-[10px] truncate font-normal ${
                          isActive ? 'text-slate-400' : 'text-slate-400'
                        }`}
                      >
                        {item.subLabel}
                      </div>
                    )}
                  </div>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 border ${
                      isActive
                        ? 'bg-slate-800 text-amber-300 border-slate-700'
                        : item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
