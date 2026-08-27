import React from 'react';
import {
  Building,
  Sliders,
  FileText,
  DollarSign,
  TrendingUp,
  Briefcase,
  Percent,
  CheckCircle2,
  Users,
  Award,
  ShieldAlert
} from 'lucide-react';

export type BusinessTab =
  | 'overview'
  | 'margin-calculator'
  | 'commercial-pricing'
  | 'risk-customs'
  | 'client-quotes'
  | 'commission-ledger';

interface BusinessSidebarNavProps {
  activeTab: BusinessTab;
  onSelectTab: (tab: BusinessTab) => void;
  quotationsCount: number;
}

interface NavItem {
  id: BusinessTab;
  label: string;
  subLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
  highlight?: boolean;
}

export const BusinessSidebarNav: React.FC<BusinessSidebarNavProps> = ({
  activeTab,
  onSelectTab,
  quotationsCount,
}) => {
  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Executive Overview',
      subLabel: 'Revenue, margin & yield KPIs',
      icon: TrendingUp,
    },
    {
      id: 'margin-calculator',
      label: 'Margin & Markup Studio',
      subLabel: 'Dynamic profit & tier pricing',
      icon: Sliders,
      highlight: true,
    },
    {
      id: 'commercial-pricing',
      label: 'Commercial Pricing Desk',
      subLabel: 'Multi-corridor markup governance',
      icon: Percent,
    },
    {
      id: 'risk-customs',
      label: 'Risk & Customs Intelligence',
      subLabel: '5-pillar risk, customs tariffs & weather',
      icon: ShieldAlert,
      badge: '5-Pillar',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 font-black',
    },
    {
      id: 'client-quotes',
      label: 'Shipper Quote Approvals',
      subLabel: 'Review & approve shipper tariffs',
      icon: FileText,
      badge: quotationsCount,
      badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    },
    {
      id: 'commission-ledger',
      label: 'Commission & Settlements',
      subLabel: 'Profit distributions & payouts',
      icon: DollarSign,
      badge: 'Live',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Business Portal Navigation Box */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between px-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Briefcase className="w-3.5 h-3.5" />
            <span>BUSINESS PORTAL</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
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
                    : 'text-slate-700 hover:bg-indigo-50/60 hover:text-slate-950'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      isActive
                        ? 'bg-indigo-500 text-white shadow-sm'
                        : item.highlight
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="font-extrabold truncate">{item.label}</div>
                    {item.subLabel && (
                      <div className="text-[10px] truncate font-normal text-slate-400">
                        {item.subLabel}
                      </div>
                    )}
                  </div>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 border ${
                      isActive
                        ? 'bg-slate-800 text-indigo-300 border-slate-700'
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

      {/* Commercial Governance Card */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-5 text-white shadow-md space-y-3">
        <div className="flex items-center gap-2 text-indigo-300 text-xs font-black uppercase tracking-wider">
          <Award className="w-4 h-4" />
          <span>Yield Optimization</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Configure tier markups, calculate net margins per lane, and authorize automated approval ceilings for enterprise shipper accounts.
        </p>
        <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800">
          <span>Synced with Shipper Quotes</span>
          <span className="text-emerald-400 font-bold">● Active Sync</span>
        </div>
      </div>
    </div>
  );
};
