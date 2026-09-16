import React, { useState } from 'react';
import {
  Ship,
  Plane,
  Truck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  FileText,
  AlertTriangle,
  X,
  ChevronRight,
  Info,
  DollarSign,
  Sparkles,
  Layers,
  Award,
  Zap
} from 'lucide-react';
import { CarrierOptionQuote, QuoteFormState, TariffBreakdown } from '../types';
import { formatCurrency } from '../utils/calculator';
import { PORTS_AND_HUBS } from '../data/freightData';

interface CarrierQuoteSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: QuoteFormState;
  breakdown: TariffBreakdown;
  carrierQuotes: CarrierOptionQuote[];
  onSelectCarrierQuote: (carrier: CarrierOptionQuote) => void;
}

export const CarrierQuoteSelectionModal: React.FC<CarrierQuoteSelectionModalProps> = ({
  isOpen,
  onClose,
  formData,
  breakdown,
  carrierQuotes,
  onSelectCarrierQuote,
}) => {
  const [selectedCarrierForDetails, setSelectedCarrierForDetails] = useState<CarrierOptionQuote | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  if (!isOpen) return null;

  const originPort = PORTS_AND_HUBS.find((p) => p.code === formData.originPortCode);
  const destPort = PORTS_AND_HUBS.find((p) => p.code === formData.destinationPortCode);
  const isAir = formData.transportMode === 'air';

  const handleSelectCarrier = (carrier: CarrierOptionQuote) => {
    setIsSubmitting(carrier.carrierId);
    setTimeout(() => {
      onSelectCarrierQuote(carrier);
      setIsSubmitting(null);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-400">
                <Sparkles className="w-4 h-4" />
                <span>AI Freight Route & Rate Comparison Engine</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Select Your Shipping Line / Carrier Quotation
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
                Compare verified tier-1 carriers for this lane. Selecting a company forwards your quotation and 4 compliance documents to their freight agent desk for AI analysis & operational verification.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Route Summary Pill */}
          <div className="mt-5 p-4 bg-white/10 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300">
                {isAir ? <Plane className="w-4 h-4" /> : <Ship className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Corridor Route</div>
                <div className="font-black text-white text-sm">
                  {originPort?.city || formData.originPortCode} ({formData.originPortCode}) <ArrowRight className="inline w-3.5 h-3.5 text-blue-400 mx-1" /> {destPort?.city || formData.destinationPortCode} ({formData.destinationPortCode})
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Chargeable Mass</div>
                <div className="font-black text-white">{breakdown.chargeableWeightKg.toLocaleString()} kg</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Cargo Volume</div>
                <div className="font-black text-white">{breakdown.totalVolumeCbm.toFixed(2)} CBM</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Documents</div>
                <div className="font-black text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 4 of 4 Uploaded
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carrier Quotes Grid (3 Companies) */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>3 Verified Carrier Quotations Ready for Selection</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">Valid for next 14 calendar days</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {carrierQuotes.map((carrier, idx) => {
              const isBestValue = idx === 0;
              const isFastest = carrier.transitDays === Math.min(...carrierQuotes.map(c => c.transitDays));

              return (
                <div
                  key={carrier.carrierId}
                  className={`relative bg-white rounded-3xl border transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl ${
                    isBestValue
                      ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-blue-500/5'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {/* Badge */}
                  {isBestValue && (
                    <div className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest text-center py-1.5 flex items-center justify-center gap-1">
                      <Award className="w-3 h-3" /> Recommended Choice
                    </div>
                  )}
                  {!isBestValue && isFastest && (
                    <div className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest text-center py-1.5 flex items-center justify-center gap-1">
                      <Zap className="w-3 h-3" /> Fastest Transit Time
                    </div>
                  )}

                  <div className="p-6 space-y-5 flex-1">
                    {/* Carrier Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                          {carrier.directOrTranshipment}
                        </span>
                        <h3 className="text-lg font-black text-slate-900 mt-2">{carrier.carrierName}</h3>
                        <p className="text-xs text-slate-500 font-medium">Reliability SLA: {carrier.reliabilityScore}</p>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-700 border border-slate-200">
                        {carrier.logoCode || carrier.carrierName.slice(0, 2).toUpperCase()}
                      </div>
                    </div>

                    {/* Price & Transit */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Total All-in Offer</div>
                      <div className="text-2xl font-black text-slate-900 tracking-tight">
                        {formatCurrency(carrier.totalOfferInr, carrier.currency)}
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                        <span className="flex items-center gap-1 font-bold">
                          <Clock className="w-3.5 h-3.5 text-blue-600" /> {carrier.transitDays} Days Transit
                        </span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                          {carrier.freeDetentionDays}d Free Detention
                        </span>
                      </div>
                    </div>

                    {/* Features checklist */}
                    <div className="space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Included Service Features</div>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        {carrier.features.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="leading-tight font-medium">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-6 pt-0 space-y-2">
                    <button
                      onClick={() => setSelectedCarrierForDetails(carrier)}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>View Quotation in Details</span>
                    </button>

                    <button
                      onClick={() => handleSelectCarrier(carrier)}
                      disabled={Boolean(isSubmitting)}
                      className={`w-full py-3 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isBestValue
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {isSubmitting === carrier.carrierId ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Routing to Agent Desk...</span>
                        </>
                      ) : (
                        <>
                          <span>Select & Send for Verification</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-100 text-xs text-blue-900 flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Next Stage in Lifecycle:</span> Selecting a carrier forwards this quotation along with your 4 uploaded regulatory documents (Commercial Invoice, Packing List, Bill of Lading Draft, and Certificate of Origin) to the carrier's dedicated Freight Agent desk. The AI agent will inspect route weather, customs risk, and tariff margins before notifying you for approval.
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Sub-Modal */}
        {selectedCarrierForDetails && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-base font-black text-slate-900">Itemized Commercial Breakdown</h4>
                  <p className="text-xs text-slate-500">{selectedCarrierForDetails.carrierName} Quotation Specification</p>
                </div>
                <button
                  onClick={() => setSelectedCarrierForDetails(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Base Ocean / Air Freight:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(selectedCarrierForDetails.breakdown.baseFreight, 'INR')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Bunker Fuel Surcharge (BAF / FSC):</span>
                  <span className="font-bold text-slate-900">{formatCurrency(selectedCarrierForDetails.breakdown.bafFuelSurcharge, 'INR')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Terminal Handling Charges (THC Origin + Dest):</span>
                  <span className="font-bold text-slate-900">{formatCurrency(selectedCarrierForDetails.breakdown.terminalHandlingCharge, 'INR')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Regulatory Documentation & BL Filing:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(selectedCarrierForDetails.breakdown.documentationFee, 'INR')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">All-Risk Cargo Insurance (Institute Cargo Clause A):</span>
                  <span className="font-bold text-slate-900">{formatCurrency(selectedCarrierForDetails.breakdown.insuranceFee, 'INR')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">AI Weather & Corridor Congestion Surcharge:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(selectedCarrierForDetails.breakdown.riskAdjustment, 'INR')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">GST / Statutory Taxes (18%):</span>
                  <span className="font-bold text-slate-900">{formatCurrency(selectedCarrierForDetails.breakdown.taxAmount, 'INR')}</span>
                </div>
                <div className="flex justify-between py-2 text-sm font-black text-slate-900 bg-slate-50 px-3 rounded-xl border border-slate-200">
                  <span>Net Total Offer:</span>
                  <span className="text-blue-700">{formatCurrency(selectedCarrierForDetails.totalOfferInr, 'INR')}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedCarrierForDetails(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Close Breakdown
                </button>
                <button
                  onClick={() => {
                    const chosen = selectedCarrierForDetails;
                    setSelectedCarrierForDetails(null);
                    handleSelectCarrier(chosen);
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <span>Select {selectedCarrierForDetails.carrierName}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
