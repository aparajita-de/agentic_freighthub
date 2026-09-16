import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Printer,
  ExternalLink,
  MapPin,
  Clock,
  Ship,
  Plane,
  Truck,
  ShieldCheck,
  AlertTriangle,
  FileText,
  ChevronRight,
  Sparkles,
  User
} from 'lucide-react';
import { SavedQuotation } from '../types';
import { formatCurrency } from '../utils/calculator';

interface QuotationRecordModalProps {
  isOpen: boolean;
  quotation: SavedQuotation | null;
  onClose: () => void;
  onOpenSelectedQuotes?: () => void;
  onPrint?: () => void;
}

export const QuotationRecordModal: React.FC<QuotationRecordModalProps> = ({
  isOpen,
  quotation,
  onClose,
  onOpenSelectedQuotes,
  onPrint,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !quotation) return null;

  const quoteId = quotation.id || 'QTE-E90C17CA';
  const carrierName = quotation.assignedCarrier || 'Maersk';
  const isAir = quotation.transportMode === 'air';
  const modeLabel = isAir ? 'Air Freight' : quotation.transportMode === 'ground' ? 'Road Freight' : 'Ocean Freight';

  const originCity = quotation.originCode || 'Mumbai';
  const destCity = quotation.destinationCode || 'Singapore';
  const transitDays = quotation.breakdown?.estimatedTransitDays || (isAir ? '2d' : '14d');
  const transitPill = transitDays.includes('d') ? transitDays : `${transitDays}d`;
  const transitSubtext = isAir ? 'Priority Air Corridor' : 'Direct Maritime Transit';

  const selectionRef = quotation.selectionRef || `SEL-${quoteId.slice(-8)}`;
  const shipmentRef = quotation.shipmentId || `SHP-${quoteId.slice(-8)}`;
  const verificationRef = `VR-${quoteId.slice(-8)}`;

  const isBooked = quotation.status === 'BOOKING_CONFIRMED' || quotation.status === 'BOOKED';
  const isCustomsApproved = quotation.status === 'CUSTOMS_OFFICER_APPROVED' || isBooked;
  const isAgentApproved = quotation.status === 'APPROVED' || quotation.status === 'UNDER_CUSTOMS_REVIEW' || isCustomsApproved;
  const isSentToCompany = Boolean(quotation.assignedCarrier);

  const handleCopy = () => {
    navigator.clipboard?.writeText(quoteId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const baseFreight = quotation.breakdown?.baseFreightInr || quotation.breakdown?.baseTariff || Math.round(quotation.tariffAmount * 0.76);
  const fuelSurcharge = quotation.breakdown?.fuelSurchargeInr || quotation.breakdown?.bafFuelSurcharge || Math.round(quotation.tariffAmount * 0.08);
  const handling = quotation.breakdown?.terminalHandlingInr || quotation.breakdown?.terminalHandlingCharge || Math.round(quotation.tariffAmount * 0.14);
  const docFee = quotation.breakdown?.documentationFeeInr || quotation.breakdown?.documentationFee || 3000;

  const totalOffer = quotation.tariffAmount || (baseFreight + fuelSurcharge + handling + docFee);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Bar matching Screenshot 1 */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              QUOTATION RECORD
            </span>
            <span className="text-sm font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
              {quoteId}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
              title="Copy Quotation ID"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
              QUOTE: SENT TO {carrierName.toUpperCase()}
            </span>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">
              SHIPMENT: {isBooked ? 'BOOKED' : 'QUOTED'}
            </span>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
              {isAir ? <Plane className="w-3 h-3 text-sky-600" /> : <Ship className="w-3 h-3 text-blue-600" />}
              <span>{modeLabel}</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stepper 1: Top 6-Stage Progress Tracker matching Screenshot 1 */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                  ✓
                </div>
                <div>
                  <div className="text-[11px] font-black text-slate-900">1. Requested</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">CUSTOMER</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                  ✓
                </div>
                <div>
                  <div className="text-[11px] font-black text-slate-900">2. Generated</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">AI ENGINE</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                  ✓
                </div>
                <div>
                  <div className="text-[11px] font-black text-slate-900">3. Pending Review</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">CUSTOMS/OPS</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isAgentApproved ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                }`}>
                  {isAgentApproved ? '✓' : '4'}
                </div>
                <div>
                  <div className="text-[11px] font-black text-blue-900">4. Approved by {carrierName}</div>
                  <div className="text-[9px] font-bold text-blue-600 uppercase">COMPANY - Sent to {carrierName}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isCustomsApproved ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {isCustomsApproved ? '✓' : '5'}
                </div>
                <div>
                  <div className="text-[11px] font-black text-slate-900">5. Under Customs Officer Review</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">CUSTOMS OFFICER</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isBooked ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {isBooked ? '✓' : '6'}
                </div>
                <div>
                  <div className="text-[11px] font-black text-slate-900">6. Booked</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">FINAL</div>
                </div>
              </div>
            </div>

            {/* Status Details Row */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs gap-3">
              <div>
                <span className="text-slate-400 font-bold">Quote Status: </span>
                <span className="font-extrabold text-amber-700">Sent to {carrierName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold">Shipment Status: </span>
                <span className="font-extrabold text-blue-700">{isBooked ? 'BOOKED' : 'QUOTED'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold">Active Reviewer: </span>
                <span className="font-extrabold text-slate-800">{carrierName}</span>
              </div>
            </div>
          </div>

          {/* Route Details Banner matching Screenshot 1 */}
          <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
            {/* Origin Card */}
            <div className="md:col-span-4 bg-slate-900 text-white p-4 rounded-2xl flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-xl text-white">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">ORIGIN</div>
                <div className="text-base font-black text-white">{originCity}</div>
                <div className="text-xs text-slate-300 font-medium">{quotation.originCode}</div>
              </div>
            </div>

            {/* Transit Pill Card */}
            <div className="md:col-span-3 text-center p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center">
              <div className="flex items-center gap-1.5 font-black text-xs text-slate-800">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{transitPill}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                {transitSubtext}
              </div>
            </div>

            {/* Destination Card */}
            <div className="md:col-span-4 bg-slate-900 text-white p-4 rounded-2xl flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-xl text-white">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">DESTINATION</div>
                <div className="text-base font-black text-white">{destCity}</div>
                <div className="text-xs text-slate-300 font-medium">{quotation.destinationCode}</div>
              </div>
            </div>
          </div>

          {/* Company Verification & Booking Sub-Stepper matching Screenshot 1 */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-black text-xs text-slate-900">
                  Company verification & booking
                </span>
              </div>
              <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {carrierName} - Sent to company
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center pt-2">
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center text-xs font-bold mb-1">
                  1
                </div>
                <div className="text-[11px] font-extrabold text-slate-900">Quote</div>
                <div className="text-[9px] font-mono text-slate-500 truncate">{quoteId}</div>
                <div className="text-[8px] text-amber-600 font-bold">pending review</div>
              </div>

              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center text-xs font-bold mb-1">
                  2
                </div>
                <div className="text-[11px] font-extrabold text-slate-900">Shipment</div>
                <div className="text-[9px] font-mono text-slate-500 truncate">{shipmentRef}</div>
                <div className="text-[8px] text-blue-600 font-bold">quoted</div>
              </div>

              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center text-xs font-bold mb-1">
                  3
                </div>
                <div className="text-[11px] font-extrabold text-slate-900">Selection</div>
                <div className="text-[9px] font-mono text-slate-500 truncate">{selectionRef}</div>
                <div className="text-[8px] text-amber-600 font-bold">pending company verification</div>
              </div>

              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-xs font-bold mb-1 ${
                  isAgentApproved ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  4
                </div>
                <div className="text-[11px] font-extrabold text-slate-900">Verification</div>
                <div className="text-[9px] font-mono text-slate-500 truncate">{verificationRef}</div>
                <div className="text-[8px] text-slate-500 font-bold">
                  {isAgentApproved ? 'verified' : 'pending company verification'}
                </div>
              </div>

              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-xs font-bold mb-1 ${
                  isCustomsApproved ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  5
                </div>
                <div className="text-[11px] font-extrabold text-slate-900">Customs</div>
                <div className="text-[9px] font-mono text-slate-500 truncate">
                  {quotation.clearanceCertificateNumber || 'Not yet'}
                </div>
                <div className="text-[8px] text-slate-500 font-bold">
                  {isCustomsApproved ? 'cleared' : 'Not yet'}
                </div>
              </div>

              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-xs font-bold mb-1 ${
                  isBooked ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  6
                </div>
                <div className="text-[11px] font-extrabold text-slate-900">Booking</div>
                <div className="text-[9px] font-mono text-slate-500 truncate">
                  {quotation.bookingReference || 'Not yet'}
                </div>
                <div className="text-[8px] text-slate-500 font-bold">
                  {isBooked ? 'confirmed' : 'Not yet'}
                </div>
              </div>
            </div>
          </div>

          {/* Two-Column Details matching Screenshot 1 Bottom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left Box: Consignee & Cargo Specifications */}
            <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-800">
                <User className="w-4 h-4 text-blue-600" />
                <span>Consignee & Cargo Specifications</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Customer Name</span>
                  <span className="font-extrabold text-slate-900 font-mono">
                    {quotation.shipperEmail || quotation.shipperName || 'customer@freightai.com'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Lane</span>
                  <span className="font-extrabold text-slate-900 font-mono">
                    {originCity} → {destCity}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Cargo Basis</span>
                  <span className="font-extrabold text-slate-900">
                    {quotation.cargoSummary || `${quotation.breakdown?.chargeableWeightKg || 18500} kg / 20 CBM`}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Freight Mode</span>
                  <span className="font-extrabold text-slate-900">{modeLabel}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Quote date</span>
                  <span className="font-extrabold text-slate-900">
                    {quotation.createdAt || '16 Sept 2026'}
                  </span>
                </div>
              </div>

              {/* AI Risk Assessment Box matching Screenshot 1 */}
              <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>AI risk assessment: MEDIUM</span>
                </div>
                <p className="text-[11px] font-mono text-emerald-700">
                  Overall 46/100 • weather 78 • customs 52 • route 20
                </p>
              </div>
            </div>

            {/* Right Box: Commercial Pricing Breakdown */}
            <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-800">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Commercial Pricing Breakdown</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Base freight</span>
                  <span className="font-mono font-extrabold text-slate-900">
                    {formatCurrency(baseFreight, quotation.currency)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Fuel surcharge</span>
                  <span className="font-mono font-extrabold text-slate-900">
                    {formatCurrency(fuelSurcharge, quotation.currency)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Handling</span>
                  <span className="font-mono font-extrabold text-slate-900">
                    {formatCurrency(handling, quotation.currency)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Documentation</span>
                  <span className="font-mono font-extrabold text-slate-900">
                    {formatCurrency(docFee, quotation.currency)}
                  </span>
                </div>

                <div className="pt-2 flex justify-between items-baseline">
                  <div>
                    <div className="font-black text-slate-900 text-sm">
                      {carrierName} offer
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {carrierName}'s rate card at the AI market rate
                    </div>
                  </div>
                  <div className="text-xl font-black text-slate-900 font-mono">
                    {formatCurrency(totalOffer, quotation.currency)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls matching Screenshot 1 */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onPrint}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Summary</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
              {carrierName} • Sent to company
            </span>

            {onOpenSelectedQuotes && (
              <button
                type="button"
                onClick={onOpenSelectedQuotes}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
              >
                Open in Selected Quotes
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
