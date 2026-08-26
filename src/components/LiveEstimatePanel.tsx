import React from 'react';
import {
  Zap,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { TariffBreakdown } from '../types';

interface LiveEstimatePanelProps {
  breakdown: TariffBreakdown;
  onOpenAgentCalculation: () => void;
  isEstimateCalculated?: boolean;
  onViewGeneratedQuote?: () => void;
}

export const LiveEstimatePanel: React.FC<LiveEstimatePanelProps> = ({
  breakdown,
  onOpenAgentCalculation,
  isEstimateCalculated = false,
  onViewGeneratedQuote,
}) => {
  return (
    <div className="bg-[#0F172A] text-white rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-5 max-h-[calc(100vh-6rem)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          <h3 className="font-extrabold text-sm tracking-wide text-white uppercase">
            LIVE ESTIMATE
          </h3>
        </div>
        <span
          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
            isEstimateCalculated
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          {isEstimateCalculated ? 'ESTIMATE COMPUTED' : 'PENDING GENERATION'}
        </span>
      </div>

      {/* Details List */}
      <div className="space-y-3 text-xs">
        <div className="flex items-start justify-between gap-2">
          <span className="text-slate-400 font-medium shrink-0">Charge Basis</span>
          <span className="text-right font-bold text-white max-w-[170px] truncate">
            {isEstimateCalculated ? breakdown.chargeBasis : '— (Click Generate Quote)'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium">Cargo Count</span>
          <span className="font-bold text-white">{isEstimateCalculated ? (breakdown.cargoCountSummary || '1 Cargo Item') : '—'}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium">Total Weight</span>
          <span className="font-bold text-white">{isEstimateCalculated ? `${breakdown.totalWeightKg} kg` : '0 kg'}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium">Est. Distance</span>
          <span className="font-bold text-white">{isEstimateCalculated ? breakdown.estimatedDistanceNmOrKm : '—'}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium">Est. Transit</span>
          <span className="font-bold text-white">{isEstimateCalculated ? breakdown.estimatedTransitDays : '—'}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium">Est. Arrival</span>
          <span className="font-bold text-cyan-400">{isEstimateCalculated ? breakdown.estimatedArrivalDate : '—'}</span>
        </div>
      </div>

      {/* ACTION BUTTON SECTION: Only "GENERATE QUOTE" before calculation (Confirm Quote button removed as requested) */}
      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={onOpenAgentCalculation}
          className={`w-full relative group overflow-hidden font-black py-4 px-4 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-xl cursor-pointer active:scale-95 ${
            !isEstimateCalculated
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-500 text-white shadow-blue-600/40 ring-2 ring-blue-400/50'
              : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40'
          }`}
        >
          <div className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
          <span className="flex items-center gap-2 relative z-10">
            <Zap className={`w-4 h-4 ${!isEstimateCalculated ? 'text-amber-300 fill-amber-300 animate-pulse' : 'text-cyan-400'}`} />
            <span>{isEstimateCalculated ? 'RE-GENERATE QUOTE' : 'GENERATE QUOTE'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        </button>

        {/* If calculated, also provide quick access to open the generated quote summary card */}
        {isEstimateCalculated && onViewGeneratedQuote && (
          <button
            type="button"
            onClick={onViewGeneratedQuote}
            className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-500 text-white font-extrabold py-3 px-4 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>VIEW GENERATED QUOTE / CONFIRM</span>
          </button>
        )}
      </div>
    </div>
  );
};
