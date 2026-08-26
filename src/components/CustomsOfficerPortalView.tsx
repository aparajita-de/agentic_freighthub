import React, { useState } from 'react';
import {
  UserCheck,
  ShieldAlert,
  FileCheck2,
  CloudRain,
  BookOpen,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  Layers,
  ArrowRight,
  TrendingUp,
  LogOut,
  Sparkles,
  Gauge
} from 'lucide-react';
import { Milestone3RiskIntelligenceWorkspace, Milestone3Tab } from './Milestone3RiskIntelligenceWorkspace';
import { SEEDED_CUSTOMS_CHECKS } from '../data/milestone3Data';

interface CustomsOfficerPortalViewProps {
  officerName?: string;
  officerEmail?: string;
  onLogout?: () => void;
}

export const CustomsOfficerPortalView: React.FC<CustomsOfficerPortalViewProps> = ({
  officerName = 'Rajesh Varma',
  officerEmail = 'customer.officer@freighthub.in',
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<Milestone3Tab>('customs-officer');

  return (
    <div id="customer-officer-portal-root" className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Officer Header Card */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 border border-amber-800/40 rounded-3xl p-6 shadow-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shadow-lg shadow-amber-500/30 flex items-center justify-center font-black">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                COMPLIANCE & CUSTOMER OPERATIONS DESK
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                Active Session
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              Customer Officer Operations & Compliance Workspace
            </h1>
            <p className="text-xs text-slate-300">
              Officer: <span className="text-amber-300 font-bold">{officerName}</span> ({officerEmail}) · Compliance & Trade Verification Desk
            </p>
          </div>
        </div>

        {/* Quick Tabs in Portal Header */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('customs-officer')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'customs-officer'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Case Sign-off Console
          </button>
          <button
            onClick={() => setActiveTab('customs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'customs'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            RAG Regulations Search
          </button>
          <button
            onClick={() => setActiveTab('risk-engine')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'risk-engine'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Composite Risk Engine
          </button>
          <button
            onClick={() => setActiveTab('weather')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'weather'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Weather Radar
          </button>
        </div>
      </div>

      {/* Main Workspace Component */}
      <Milestone3RiskIntelligenceWorkspace
        initialTab={activeTab}
        userRole="customs-officer"
        userEmail={officerEmail}
      />
    </div>
  );
};
