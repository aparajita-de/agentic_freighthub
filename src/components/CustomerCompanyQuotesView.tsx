import React, { useState, useMemo } from 'react';
import {
  Ship,
  Plane,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileText,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Eye,
  Download,
  Calendar,
  DollarSign,
  Building,
  Upload,
  Sparkles,
  Info,
  X,
  Check,
  Radar,
  MapPin,
} from 'lucide-react';
import { SavedQuotation, TradeDocument, CarrierOptionQuote } from '../types';
import { formatCurrency } from '../utils/calculator';
import { addNotification } from '../services/notificationService';
import { generateCarrierOptionQuotes } from '../utils/carrierQuoteGenerator';

const getCarrierBadgeStyle = (code: string) => {
  const c = (code || '').toUpperCase();
  if (c.includes('MSK') || c.includes('MAERSK')) {
    return { bg: 'bg-[#42B0D5]/15 text-[#002B49] border-[#42B0D5]/40', label: 'MAERSK' };
  }
  if (c.includes('MSC')) {
    return { bg: 'bg-amber-100 text-amber-900 border-amber-300', label: 'MSC' };
  }
  if (c.includes('CMA')) {
    return { bg: 'bg-blue-900 text-white border-blue-800', label: 'CMA CGM' };
  }
  if (c.includes('EK') || c.includes('EMIRATES')) {
    return { bg: 'bg-red-600 text-white border-red-700', label: 'EMIRATES' };
  }
  if (c.includes('QR') || c.includes('QATAR')) {
    return { bg: 'bg-[#5C0632] text-white border-[#400222]', label: 'QATAR' };
  }
  if (c.includes('DHL')) {
    return { bg: 'bg-yellow-400 text-red-800 border-yellow-500', label: 'DHL' };
  }
  return { bg: 'bg-slate-900 text-white border-slate-800', label: code || 'CARRIER' };
};

interface CustomerCompanyQuotesViewProps {
  quotations: SavedQuotation[];
  onUpdateQuotation: (quote: SavedQuotation) => void;
  onNavigateToTracking?: () => void;
  onViewQuotePDF?: (quote: SavedQuotation) => void;
  initialSelectedQuoteId?: string;
}

export const CustomerCompanyQuotesView: React.FC<CustomerCompanyQuotesViewProps> = ({
  quotations,
  onUpdateQuotation,
  onNavigateToTracking,
  onViewQuotePDF,
  initialSelectedQuoteId,
}) => {
  const [selectedQuote, setSelectedQuote] = useState<SavedQuotation | null>(() => {
    if (initialSelectedQuoteId) {
      const matched = quotations.find((q) => q.id === initialSelectedQuoteId);
      if (matched) return matched;
    }
    return quotations[0] || null;
  });

  const [additionalDocFile, setAdditionalDocFile] = useState<string>('');
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [selectedCarrierDetail, setSelectedCarrierDetail] = useState<CarrierOptionQuote | null>(null);
  const [showCarrierComparison, setShowCarrierComparison] = useState<boolean>(true);

  // Filter quotes that have a company selection or are part of company workflow
  const activeQuotes = quotations.filter((q) => Boolean(q.assignedCarrier || q.selectionRef || q.status));

  // Compute 3 carrier options for selected quote with NaN resilience
  const carrierOptions: CarrierOptionQuote[] = useMemo(() => {
    if (!selectedQuote) return [];
    if (selectedQuote.carrierQuotes && selectedQuote.carrierQuotes.length > 0) {
      const hasNaN = selectedQuote.carrierQuotes.some(
        (c) =>
          !c.breakdown ||
          isNaN(Number(c.breakdown.baseFreight)) ||
          isNaN(Number(c.breakdown.bafFuelSurcharge)) ||
          isNaN(Number(c.breakdown.total)) ||
          isNaN(Number(c.totalOfferInr))
      );
      if (!hasNaN) {
        return selectedQuote.carrierQuotes;
      }
    }
    return generateCarrierOptionQuotes(selectedQuote.formData, selectedQuote.breakdown);
  }, [selectedQuote]);

  const handleChooseCarrierAndVerify = (carrier: CarrierOptionQuote) => {
    if (!selectedQuote) return;
    setIsProcessingAction(true);
    setTimeout(() => {
      const updatedBreakdown = {
        ...selectedQuote.breakdown,
        baseFreightInr: carrier.breakdown.baseFreight,
        fuelSurchargeInr: carrier.breakdown.bafFuelSurcharge,
        terminalHandlingInr: carrier.breakdown.terminalHandlingCharge,
        documentationFeeInr: carrier.breakdown.documentationFee,
        totalTariffInr: carrier.totalOfferInr,
      };

      const updated: SavedQuotation = {
        ...selectedQuote,
        assignedCarrier: carrier.carrierName,
        tariffAmount: carrier.totalOfferInr,
        breakdown: updatedBreakdown,
        status: 'SENT_TO_COMPANY',
        carrierQuotes: carrierOptions,
        selectedCarrierOption: carrier,
        auditLogs: [
          ...(selectedQuote.auditLogs || []),
          {
            id: `AUD-${Date.now()}`,
            quoteId: selectedQuote.id,
            action: 'CARRIER_SELECTED_SENT_FOR_VERIFICATION',
            modifiedBy: selectedQuote.shipperEmail || 'customer@freightai.com',
            reason: `Customer selected ${carrier.carrierName} and transmitted quotation to Freight Agent for AI verification`,
            previousValue: selectedQuote.status,
            newValue: 'SENT_TO_COMPANY',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      onUpdateQuotation(updated);
      setSelectedQuote(updated);
      setShowCarrierComparison(false);
      setSelectedCarrierDetail(null);
      setIsProcessingAction(false);

      addNotification({
        targetRole: 'freight-agent',
        quoteId: selectedQuote.id,
        title: `New Carrier Quote: ${carrier.carrierName}`,
        message: `Customer selected ${carrier.carrierName} (${formatCurrency(carrier.totalOfferInr, 'INR')}) for quote ${selectedQuote.id}. AI operational verification and line-item calibration required.`,
        type: 'action_required',
      });

      addNotification({
        targetRole: 'customer',
        quoteId: selectedQuote.id,
        title: `Submitted to ${carrier.carrierName} Agent Desk`,
        message: `Your selected quote with ${carrier.carrierName} has been sent to the Freight Agent desk for AI operational and tariff verification.`,
        type: 'info',
      });

      setActionSuccessMessage(`Selected ${carrier.carrierName} — Quotation transmitted to Freight Agent for AI verification.`);
      setTimeout(() => setActionSuccessMessage(null), 5000);
    }, 500);
  };

  const handleCustomerConfirmTerms = (quote: SavedQuotation) => {
    setIsProcessingAction(true);
    setTimeout(() => {
      const updated: SavedQuotation = {
        ...quote,
        status: 'UNDER_CUSTOMS_REVIEW',
        customerConfirmedAt: new Date().toISOString(),
        auditLogs: [
          ...(quote.auditLogs || []),
          {
            id: `AUD-${Date.now()}`,
            quoteId: quote.id,
            action: 'CUSTOMER_CONFIRMED_TERMS',
            modifiedBy: quote.shipperEmail || 'customer@freightai.com',
            reason: 'Customer accepted verified quote and forwarded to Customs for regulatory clearance',
            previousValue: quote.status,
            newValue: 'UNDER_CUSTOMS_REVIEW',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      onUpdateQuotation(updated);
      setSelectedQuote(updated);

      // Dispatch notifications to Freight Agent and Customs Officer
      addNotification({
        targetRole: 'customs-officer',
        quoteId: quote.id,
        title: 'New Consignment for Customs Clearance',
        message: `Shipper confirmed terms for ${quote.id} (${quote.routeSummary}). 4 regulatory documents ready for statutory inspection.`,
        type: 'action_required',
      });

      addNotification({
        targetRole: 'customer',
        quoteId: quote.id,
        title: 'Forwarded to Customs Officer Desk',
        message: `Your quotation ${quote.id} with ${quote.assignedCarrier || 'carrier'} has been sent to the Chief Customs Officer for regulatory clearance sign-off.`,
        type: 'info',
      });

      setIsProcessingAction(false);
      setActionSuccessMessage('Terms confirmed! Consignment has been forwarded to the Customs Officer queue for statutory review.');
      setTimeout(() => setActionSuccessMessage(null), 5000);
    }, 600);
  };

  const handleUploadRequestedDoc = (quote: SavedQuotation) => {
    if (!additionalDocFile) return;
    setIsProcessingAction(true);
    setTimeout(() => {
      const newDoc: TradeDocument = {
        id: `DOC-ADD-${Date.now()}`,
        name: additionalDocFile,
        type: 'additional',
        fileSize: '1.4 MB',
        uploadedAt: new Date().toISOString(),
        status: 'uploaded',
      };

      const updatedDocs = [...(quote.uploadedDocuments || []), newDoc];
      const updatedReqs = (quote.requestedDocuments || []).map((r) => ({
        ...r,
        status: 'submitted' as const,
        submittedAt: new Date().toISOString(),
        fileName: additionalDocFile,
      }));

      const updated: SavedQuotation = {
        ...quote,
        status: 'UNDER_CUSTOMS_REVIEW',
        uploadedDocuments: updatedDocs,
        requestedDocuments: updatedReqs,
        auditLogs: [
          ...(quote.auditLogs || []),
          {
            id: `AUD-${Date.now()}`,
            quoteId: quote.id,
            action: 'ADDITIONAL_DOC_SUBMITTED',
            modifiedBy: quote.shipperEmail || 'customer@freightai.com',
            reason: `Customer submitted requested document: ${additionalDocFile}`,
            previousValue: quote.status,
            newValue: 'UNDER_CUSTOMS_REVIEW',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      onUpdateQuotation(updated);
      setSelectedQuote(updated);
      setAdditionalDocFile('');

      addNotification({
        targetRole: 'customs-officer',
        quoteId: quote.id,
        title: 'Requested Document Submitted',
        message: `Shipper uploaded requested document (${additionalDocFile}) for ${quote.id}. Compliance review resumed.`,
        type: 'action_required',
      });

      setIsProcessingAction(false);
      setActionSuccessMessage(`Document "${additionalDocFile}" uploaded and transmitted to Customs Officer.`);
      setTimeout(() => setActionSuccessMessage(null), 5000);
    }, 600);
  };

  const handleConfirmFinalBooking = (quote: SavedQuotation) => {
    setIsProcessingAction(true);
    setTimeout(() => {
      const bookingRef = `BK-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const shipmentId = `SHP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      const updated: SavedQuotation = {
        ...quote,
        status: 'BOOKING_CONFIRMED',
        bookingReference: bookingRef,
        shipmentId: shipmentId,
        carrierVoyageNumber: '26092E',
        containerEquipmentNumber: 'MSKU-7401432',
        containerSealNumber: 'ML-IN-881432',
        auditLogs: [
          ...(quote.auditLogs || []),
          {
            id: `AUD-${Date.now()}`,
            quoteId: quote.id,
            action: 'BOOKING_FINALIZED',
            modifiedBy: quote.shipperEmail || 'customer@freightai.com',
            reason: `Final commercial booking confirmed. Booking Ref: ${bookingRef}`,
            previousValue: quote.status,
            newValue: 'BOOKING_CONFIRMED',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      // Also persist shipment into saved shipments store
      try {
        const stored = localStorage.getItem('freighthub_saved_shipments_v1');
        const list = stored ? JSON.parse(stored) : [];
        const newShipment = {
          id: shipmentId,
          trackingId: shipmentId,
          bookingReference: bookingRef,
          shipper: quote.shipperName || quote.companyName,
          consignee: 'Global Import Distribution Pte Ltd',
          origin: quote.originCode,
          destination: quote.destinationCode,
          mode: quote.transportMode,
          status: 'BOOKED',
          carrier: quote.assignedCarrier || 'Maersk Line',
          containerType: '40HC Container',
          cargoWeightKg: quote.breakdown.chargeableWeightKg,
          cargoVolumeCbm: quote.breakdown.totalVolumeCbm,
          vesselName: 'MAERSK MC-KINNEY MOLLER',
          voyageNumber: '26092E',
          eta: '2026-09-28',
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('freighthub_saved_shipments_v1', JSON.stringify([newShipment, ...list]));
      } catch (e) {
        console.error('Failed to update shipment records:', e);
      }

      onUpdateQuotation(updated);
      setSelectedQuote(updated);

      addNotification({
        targetRole: 'customer',
        quoteId: quote.id,
        bookingId: bookingRef,
        title: 'Shipment Successfully Booked & Generated!',
        message: `Booking ${bookingRef} generated with ${quote.assignedCarrier}. Equipment ${updated.containerEquipmentNumber} allocated. Track live vessel telemetry now!`,
        type: 'success',
        actionView: 'tracking',
      });

      setIsProcessingAction(false);
      setActionSuccessMessage(`Booking confirmed! Shipment ID: ${shipmentId}, Booking Reference: ${bookingRef}`);
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-400">
              <Building className="w-4 h-4" />
              <span>Carrier Quotations & Operational Lifecycle</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Your Selected Shipping Companies
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Picking a company starts their verification desk. Track real-time progress as your quotation moves from Freight Agent AI verification through statutory Customs Officer sign-off to final container booking.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 bg-blue-500/20 text-blue-300 rounded-xl text-xs font-bold border border-blue-500/30">
              {activeQuotes.length} Active Consignments
            </span>
          </div>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center justify-between border border-emerald-500 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span className="text-xs font-bold">{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="p-1 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-700/50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Left List + Right Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List of Selected Quotes */}
        <div className="lg:col-span-4 space-y-4">
          <div className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
            Active Requests & Carrier Selections
          </div>

          {activeQuotes.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
              <Ship className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="text-sm font-bold text-slate-800">No Carrier Quotes Selected Yet</div>
              <p className="text-xs text-slate-500">
                Go to the "Calculation" tab, enter your route and cargo, upload the 4 trade documents, and choose from the 3 carrier quotations.
              </p>
            </div>
          ) : (
            activeQuotes.map((q) => {
              const isSelected = selectedQuote?.id === q.id;
              const isCustomsCleared = q.status === 'CUSTOMS_OFFICER_APPROVED';
              const isBooked = q.status === 'BOOKING_CONFIRMED' || q.status === 'BOOKED';
              const isUnderCustoms = q.status === 'UNDER_CUSTOMS_REVIEW' || q.status === 'ADDITIONAL_DOCS_REQUESTED';
              const isAgentRevised = q.status === 'AGENT_REVISED';

              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedQuote(q)}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-blue-50/50 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-black text-slate-900 truncate">
                          {q.companyName || q.shipperName || 'Consignment Request'}
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {q.selectionRef || q.id}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-blue-600 flex items-center gap-1 mt-0.5">
                        <span>🏢 {q.assignedCarrier || 'Pending Carrier Selection (3 Ready)'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {q.routeSummary} • {q.transportMode.toUpperCase()}
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                      isBooked
                        ? 'bg-emerald-100 text-emerald-800'
                        : isCustomsCleared
                        ? 'bg-purple-100 text-purple-800'
                        : isUnderCustoms
                        ? 'bg-indigo-100 text-indigo-800'
                        : isAgentRevised
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {q.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Manual Addresses if present */}
                  {(q.pickupAddress || q.deliveryAddress) && (
                    <div className="text-[10px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 space-y-0.5">
                      {q.pickupAddress && (
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                          <span className="font-bold text-slate-700">Pickup:</span>
                          <span className="truncate text-slate-600">{q.pickupAddress}</span>
                        </div>
                      )}
                      {q.deliveryAddress && (
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="font-bold text-slate-700">Delivery:</span>
                          <span className="truncate text-slate-600">{q.deliveryAddress}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pricing and Action summary */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="font-extrabold text-slate-900">
                      {formatCurrency(q.tariffAmount, q.currency)}
                    </span>
                    <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                      <span>Inspect Progress</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Lifecycle Inspection & Actions */}
        <div className="lg:col-span-8">
          {selectedQuote ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500">
                    <span>Quote: {selectedQuote.id}</span>
                    {selectedQuote.selectionRef && <span>• Ref: {selectedQuote.selectionRef}</span>}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    {selectedQuote.assignedCarrier || 'Carrier'} Operational Consignment
                  </h3>
                  <div className="text-xs text-slate-500 font-medium">
                    {selectedQuote.routeSummary} • {selectedQuote.cargoSummary}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Offer</div>
                  <div className="text-2xl font-black text-blue-600">
                    {formatCurrency(selectedQuote.tariffAmount, selectedQuote.currency)}
                  </div>
                </div>
              </div>

              {/* Display manual pickup and delivery addresses if specified by customer */}
              {(selectedQuote.pickupAddress || selectedQuote.deliveryAddress) && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {selectedQuote.pickupAddress && (
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-extrabold text-slate-800 shrink-0">Door Pickup:</span>
                      <span className="text-slate-600 truncate">{selectedQuote.pickupAddress}</span>
                    </div>
                  )}
                  {selectedQuote.deliveryAddress && (
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-extrabold text-slate-800 shrink-0">Door Delivery:</span>
                      <span className="text-slate-600 truncate">{selectedQuote.deliveryAddress}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 3 RELATED SHIPPING LINE QUOTATIONS COMPARISON */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                      3 Related Carrier Quotations for Route
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      Vetted Shipping Lines
                    </span>
                  </div>
                  {selectedQuote.assignedCarrier && (
                    <button
                      type="button"
                      onClick={() => setShowCarrierComparison(!showCarrierComparison)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      {showCarrierComparison ? 'Hide Comparison' : '🔄 Compare / Change Carrier'}
                    </button>
                  )}
                </div>

                {showCarrierComparison && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {carrierOptions.map((carrier) => {
                      const isCurrentlyAssigned = selectedQuote.assignedCarrier === carrier.carrierName;
                      const badge = getCarrierBadgeStyle(carrier.logoCode || carrier.carrierName);

                      return (
                        <div
                          key={carrier.carrierId}
                          className={`p-4 rounded-2xl border transition-all flex flex-col justify-between h-full ${
                            isCurrentlyAssigned
                              ? 'bg-blue-50/80 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                              : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                          }`}
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`px-2.5 py-1 font-black text-[11px] rounded-lg border tracking-wider ${badge.bg}`}>
                                {badge.label}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="w-3 h-3" /> {carrier.reliabilityScore}
                              </span>
                            </div>

                            <div>
                              <div className="font-black text-sm text-slate-900 leading-snug line-clamp-1" title={carrier.carrierName}>
                                {carrier.carrierName}
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-semibold">
                                <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>{carrier.transitDays} Days Transit • {carrier.directOrTranshipment}</span>
                              </div>
                            </div>

                            {/* Detention & Equipment */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                              <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                                📦 {carrier.equipmentAvailability}
                              </span>
                              <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md">
                                ⏱️ {carrier.freeDetentionDays}d Free Detention
                              </span>
                            </div>

                            {/* Features list */}
                            <div className="space-y-1 pt-2 border-t border-slate-100 min-h-[72px]">
                              {carrier.features.slice(0, 3).map((feat, fIdx) => (
                                <div key={fIdx} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span className="line-clamp-1">{feat}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-3 mt-3 border-t border-slate-200/80 space-y-2">
                            <div className="flex items-baseline justify-between">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                Guaranteed Tariff
                              </span>
                              <span className="text-base font-black text-blue-700">
                                {formatCurrency(carrier.totalOfferInr, carrier.currency)}
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              <button
                                type="button"
                                onClick={() => handleChooseCarrierAndVerify(carrier)}
                                disabled={isProcessingAction || (isCurrentlyAssigned && selectedQuote.status !== 'REQUESTED')}
                                className={`w-full py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                                  isCurrentlyAssigned && selectedQuote.status !== 'REQUESTED'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                              >
                                {isCurrentlyAssigned && selectedQuote.status !== 'REQUESTED' ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-200" />
                                    <span>Selected & Sent</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Select {badge.label} & Send</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedCarrierDetail(carrier)}
                                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>Inspect 7 Tariff Line Items</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 6-Stage Lifecycle Progress Bar */}
              <div className="space-y-2">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>6-Stage Regulatory & Dispatch Workflow</span>
                  <span className="text-blue-600 font-bold">Live Status</span>
                </div>

                {/* Steps Horizontal Stepper */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 p-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  {[
                    { num: '1', label: 'Requested', done: true },
                    { num: '2', label: 'AI Rate', done: true },
                    { num: '3', label: 'Carrier', done: true },
                    {
                      num: '4',
                      label: 'Agent Review',
                      done: selectedQuote.status !== 'SENT_TO_COMPANY' && selectedQuote.status !== 'PENDING_REVIEW',
                      current: selectedQuote.status === 'SENT_TO_COMPANY' || selectedQuote.status === 'PENDING_REVIEW',
                    },
                    {
                      num: '5',
                      label: 'Customs',
                      done: selectedQuote.status === 'CUSTOMS_OFFICER_APPROVED' || selectedQuote.status === 'BOOKING_CONFIRMED' || selectedQuote.status === 'BOOKED',
                      current: selectedQuote.status === 'UNDER_CUSTOMS_REVIEW' || selectedQuote.status === 'ADDITIONAL_DOCS_REQUESTED',
                    },
                    {
                      num: '6',
                      label: 'Booked',
                      done: selectedQuote.status === 'BOOKING_CONFIRMED' || selectedQuote.status === 'BOOKED',
                      current: selectedQuote.status === 'CUSTOMS_OFFICER_APPROVED',
                    },
                  ].map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 ${
                        step.done
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : step.current
                          ? 'bg-blue-600 text-white ring-2 ring-blue-400/50 shadow-md'
                          : 'bg-white text-slate-400 border border-slate-200'
                      }`}
                    >
                      <span className="opacity-75">{step.num}.</span>
                      <span className="whitespace-nowrap">{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CONDITIONAL ACTION BANNERS */}

              {/* 1. AGENT REVISED TERMS: Customer must confirm to proceed to customs */}
              {selectedQuote.status === 'AGENT_REVISED' && (
                <div className="p-5 bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl space-y-4 animate-in fade-in">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="text-sm font-black text-amber-900">
                        Freight Agent Revised Quotation Terms
                      </div>
                      <p className="text-xs text-amber-800">
                        The carrier desk verified your consignment and made adjustments to rates/terms. Please review below and confirm to forward this quote to Customs for statutory clearance.
                      </p>
                      {selectedQuote.agentNotes && (
                        <div className="mt-2 p-3 bg-white/80 rounded-xl border border-amber-200 text-xs font-mono text-amber-900">
                          <span className="font-bold">Agent Remarks:</span> {selectedQuote.agentNotes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => handleCustomerConfirmTerms(selectedQuote)}
                      disabled={isProcessingAction}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {isProcessingAction ? (
                        <span>Transmitting...</span>
                      ) : (
                        <>
                          <span>Confirm Terms & Forward to Customs</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* 2. SENT TO CARRIER / PENDING AGENT REVIEW */}
              {(selectedQuote.status === 'SENT_TO_COMPANY' || selectedQuote.status === 'PENDING_REVIEW') && (
                <div className="p-5 bg-blue-50 rounded-2xl border border-blue-200 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-blue-900">
                        Consignment Under Carrier Desk AI Review
                      </div>
                      <p className="text-xs text-blue-700 mt-0.5">
                        {selectedQuote.assignedCarrier || 'The carrier'} desk has received your quotation and 4 uploaded compliance documents. You will be notified as soon as their verification is complete.
                      </p>
                    </div>
                  </div>

                  {/* Fast-track button for customer demo/testing */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleCustomerConfirmTerms(selectedQuote)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span>⚡ Advance to Customs Review Queue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* 3. UNDER CUSTOMS REVIEW */}
              {selectedQuote.status === 'UNDER_CUSTOMS_REVIEW' && (
                <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-200 space-y-3">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-indigo-900">
                        With Chief Customs Officer for Statutory Clearance
                      </div>
                      <p className="text-xs text-indigo-700 mt-0.5">
                        Your 4 compliance documents and HS tariff declaration are currently in the customs officer statutory inspection queue.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. ADDITIONAL DOCUMENTS REQUESTED BY CUSTOMS */}
              {selectedQuote.status === 'ADDITIONAL_DOCS_REQUESTED' && (
                <div className="p-5 bg-red-500/10 border-2 border-red-500/50 rounded-3xl space-y-4 animate-in fade-in">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="text-sm font-black text-red-900">
                        Customs Officer Requested Additional Compliance Documents
                      </div>
                      <p className="text-xs text-red-800">
                        The statutory clearance officer has placed a provisional hold requesting the following document before issuing Out-Of-Charge approval:
                      </p>
                      {selectedQuote.requestedDocuments && selectedQuote.requestedDocuments.length > 0 && (
                        <div className="space-y-1 mt-2">
                          {selectedQuote.requestedDocuments.map((req, rIdx) => (
                            <div key={rIdx} className="p-2.5 bg-white rounded-xl border border-red-200 text-xs">
                              <span className="font-bold text-slate-900">{req.name}</span>
                              <p className="text-slate-600 text-[11px] mt-0.5">{req.reason}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload file section */}
                  <div className="p-4 bg-white rounded-2xl border border-red-200 space-y-3">
                    <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                      Upload Requested Document
                    </label>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <input
                        type="text"
                        value={additionalDocFile}
                        onChange={(e) => setAdditionalDocFile(e.target.value)}
                        placeholder="e.g. Fumigation_Certificate_2026.pdf"
                        className="flex-1 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => setAdditionalDocFile('Fumigation_Certificate_CERT8812.pdf')}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                      >
                        ⚡ Sample File
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUploadRequestedDoc(selectedQuote)}
                        disabled={!additionalDocFile || isProcessingAction}
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Submit to Customs</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. CUSTOMS OFFICER APPROVED: Confirm Booking banner matching screenshot 15! */}
              {selectedQuote.status === 'CUSTOMS_OFFICER_APPROVED' && (
                <div className="p-6 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border-2 border-emerald-500/60 rounded-3xl space-y-4 shadow-lg animate-in fade-in">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-600 text-white rounded-xl">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-base font-black text-emerald-950">
                          Final quote ready — confirm your booking
                        </div>
                        <p className="text-xs text-emerald-800 mt-1 max-w-xl">
                          {selectedQuote.assignedCarrier || 'Carrier'} approved this shipment and Customs Officer granted official Out-Of-Charge clearance. Confirming books it at {formatCurrency(selectedQuote.tariffAmount, selectedQuote.currency)} and generates vessel container allocation.
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded-lg border border-emerald-200">
                        LEO Granted
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-emerald-500/20">
                    <button
                      onClick={() => handleConfirmFinalBooking(selectedQuote)}
                      disabled={isProcessingAction}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-xl shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      {isProcessingAction ? (
                        <span>Generating Shipment & Container Allocation...</span>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Confirm Booking</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* 6. BOOKING CONFIRMED */}
              {(selectedQuote.status === 'BOOKING_CONFIRMED' || selectedQuote.status === 'BOOKED') && (
                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-600 text-white rounded-2xl">
                        <Ship className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs font-mono font-bold text-emerald-700">
                          BOOKING CONFIRMED: {selectedQuote.bookingReference || 'BK-2026-10002'}
                        </div>
                        <div className="text-base font-black text-slate-900 mt-0.5">
                          Container {selectedQuote.containerEquipmentNumber || 'MSKU-7401432'} Allocated
                        </div>
                        <div className="text-xs text-slate-500">
                          Vessel: MAERSK MC-KINNEY MOLLER • Voyage: {selectedQuote.carrierVoyageNumber || '26092E'}
                        </div>
                      </div>
                    </div>

                    {onNavigateToTracking && (
                      <button
                        onClick={onNavigateToTracking}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer self-start sm:self-center"
                      >
                        <Radar className="w-4 h-4 text-emerald-400" />
                        <span>Track Live Telemetry</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 4 Regulatory Trade Documents Checklist (matching screenshot 3) */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Uploaded Regulatory Documents (Clearance Gate)</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 4 of 4 Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { title: 'Commercial Invoice', file: 'Commercial Invoice INV2026.pdf', size: '240 KB' },
                    { title: 'Packing List', file: 'Packing List PL9921.pdf', size: '185 KB' },
                    { title: 'Bill of Lading Draft', file: 'Bill of Lading Draft BL4810.pdf', size: '310 KB' },
                    { title: 'Certificate of Origin', file: 'Certificate of Origin COO2026.pdf', size: '290 KB' },
                  ].map((doc, dIdx) => (
                    <div key={dIdx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate">{doc.title}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">{doc.file} • {doc.size}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                        Attached
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* PDF Download and Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                {onViewQuotePDF && (
                  <button
                    onClick={() => onViewQuotePDF(selectedQuote)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Official PDF Dossier</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
              Select a quotation on the left to view details and progression.
            </div>
          )}
        </div>
      </div>
      {/* CARRIER DETAIL BREAKDOWN MODAL */}
      {selectedCarrierDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 font-black text-xs rounded-xl tracking-wider border ${getCarrierBadgeStyle(selectedCarrierDetail.logoCode || selectedCarrierDetail.carrierName).bg}`}>
                  {getCarrierBadgeStyle(selectedCarrierDetail.logoCode || selectedCarrierDetail.carrierName).label}
                </span>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {selectedCarrierDetail.carrierName}
                  </h3>
                  <div className="text-xs text-slate-500 font-medium">
                    Itemized Line-Item Tariff Breakdown & Service SLA
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCarrierDetail(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Transit Time</div>
                <div className="font-black text-slate-800 text-sm mt-0.5">{selectedCarrierDetail.transitDays} Days</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Reliability</div>
                <div className="font-black text-emerald-600 text-sm mt-0.5">{selectedCarrierDetail.reliabilityScore}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Free Detention</div>
                <div className="font-black text-blue-600 text-sm mt-0.5">{selectedCarrierDetail.freeDetentionDays} Days</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Equipment</div>
                <div className="font-black text-slate-800 text-sm mt-0.5">{selectedCarrierDetail.equipmentAvailability}</div>
              </div>
            </div>

            {/* Line-item table */}
            <div className="space-y-2">
              <div className="text-xs font-black uppercase tracking-wider text-slate-500">
                Official Carrier Tariff Line Items
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Base Freight (Ocean / Airway)</span>
                  <span className="font-bold text-slate-900">{formatCurrency(selectedCarrierDetail.breakdown.baseFreight, selectedCarrierDetail.currency)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Bunker Fuel Surcharge (BAF)</span>
                  <span className="font-bold text-slate-900">{formatCurrency(selectedCarrierDetail.breakdown.bafFuelSurcharge, selectedCarrierDetail.currency)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Terminal Handling Charges (Origin & Dest THC)</span>
                  <span className="font-bold text-slate-900">{formatCurrency(selectedCarrierDetail.breakdown.terminalHandlingCharge, selectedCarrierDetail.currency)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Carrier Documentation & EDI Filing Fee</span>
                  <span className="font-bold text-slate-900">{formatCurrency(selectedCarrierDetail.breakdown.documentationFee, selectedCarrierDetail.currency)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Cargo Marine / Air All-Risk Insurance</span>
                  <span className="font-bold text-slate-900">{formatCurrency(selectedCarrierDetail.breakdown.insuranceFee, selectedCarrierDetail.currency)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>AI Dynamic Port Congestion & Risk Buffer</span>
                  <span className="font-bold text-slate-900">{formatCurrency(selectedCarrierDetail.breakdown.riskAdjustment, selectedCarrierDetail.currency)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Statutory GST / Port Tax</span>
                  <span className="font-bold text-slate-900">{formatCurrency(selectedCarrierDetail.breakdown.taxAmount, selectedCarrierDetail.currency)}</span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="font-black text-slate-900 text-sm">Total Guaranteed Carrier Rate</span>
                  <span className="font-black text-blue-600 text-xl">{formatCurrency(selectedCarrierDetail.breakdown.total, selectedCarrierDetail.currency)}</span>
                </div>
              </div>
            </div>

            {/* Carrier inclusions */}
            <div className="space-y-2">
              <div className="text-xs font-black uppercase tracking-wider text-slate-500">
                Guaranteed Service Inclusions
              </div>
              <div className="space-y-1.5">
                {selectedCarrierDetail.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedCarrierDetail(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleChooseCarrierAndVerify(selectedCarrierDetail)}
                disabled={isProcessingAction}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Select {selectedCarrierDetail.carrierName} & Send for Verification</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
