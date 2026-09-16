import React, { useState } from 'react';
import {
  Sparkles,
  Ship,
  Plane,
  Truck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  Send,
  Edit3,
  RefreshCw,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  Clock,
  User,
  Check,
  Save,
  Sliders,
  Eye,
  XCircle,
  FileDown,
  Building2,
  Lock,
  Tag,
  Hash,
  Compass
} from 'lucide-react';
import { SavedQuotation, TradeDocument } from '../types';
import { formatCurrency } from '../utils/calculator';
import { addNotification } from '../services/notificationService';
import { DocumentViewerModal } from './DocumentViewerModal';
import { useMasterData } from '../services/masterDataService';
import { generateQuotePDF } from '../utils/pdfGenerator';

interface FreightAgentCompanyVerificationDeskProps {
  quotations: SavedQuotation[];
  onUpdateQuotation: (quote: SavedQuotation) => void;
}

export const FreightAgentCompanyVerificationDesk: React.FC<FreightAgentCompanyVerificationDeskProps> = ({
  quotations,
  onUpdateQuotation,
}) => {
  const { carriers } = useMasterData();

  const [selectedQuoteId, setSelectedQuoteId] = useState<string>(() => {
    return quotations[0]?.id || '';
  });

  const selectedQuote = quotations.find((q) => q.id === selectedQuoteId) || quotations[0];

  // Document preview modal state
  const [viewingDoc, setViewingDoc] = useState<TradeDocument | null>(null);

  // Editable fields for manual quotation adjustment
  const [editedBaseFreight, setEditedBaseFreight] = useState<number>(() => {
    return selectedQuote?.breakdown.baseFreightInr || 110000;
  });
  const [editedBaf, setEditedBaf] = useState<number>(() => {
    return selectedQuote?.breakdown.fuelSurchargeInr || 18500;
  });
  const [editedThc, setEditedThc] = useState<number>(() => {
    return selectedQuote?.breakdown.terminalHandlingInr || 12000;
  });
  const [editedDocumentation, setEditedDocumentation] = useState<number>(() => {
    return selectedQuote?.breakdown.documentationFeeInr || 4500;
  });
  const [agentRevisionNotes, setAgentRevisionNotes] = useState<string>('');

  // Industrial Allocation Parameters
  const [vesselFlightName, setVesselFlightName] = useState<string>(() => {
    return selectedQuote?.transportMode === 'air' || selectedQuote?.transportMode === 'express'
      ? 'Emirates SkyCargo EK-501 (Boeing 777F)'
      : 'CMA CGM Jacques Saadé (Voyage 2604W)';
  });
  const [bookingRefNumber, setBookingRefNumber] = useState<string>(() => {
    return `BKG-${Math.floor(100000 + Math.random() * 900000)}`;
  });
  const [freeDetentionDays, setFreeDetentionDays] = useState<number>(() => {
    return selectedQuote?.freeDetentionDays || 14;
  });
  const [gateInCutoff, setGateInCutoff] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 16);
  });

  // 9-Point checklist
  const [checklistState, setChecklistState] = useState<Record<string, 'confirmed' | 'needs_attention'>>({
    risk: 'confirmed',
    cargo: 'confirmed',
    validity: 'confirmed',
    documents: 'confirmed',
    schedule: 'confirmed',
    capacity: 'confirmed',
    commercial: 'confirmed',
    route: 'confirmed',
    shipment: 'confirmed',
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Sync state when switching quotation
  const handleSelectQuote = (quote: SavedQuotation) => {
    setSelectedQuoteId(quote.id);
    setEditedBaseFreight(quote.breakdown.baseFreightInr || 110000);
    setEditedBaf(quote.breakdown.fuelSurchargeInr || 18500);
    setEditedThc(quote.breakdown.terminalHandlingInr || 12000);
    setEditedDocumentation(quote.breakdown.documentationFeeInr || 4500);
    setAgentRevisionNotes(quote.agentNotes || '');
    setFreeDetentionDays(quote.freeDetentionDays || 14);
    setVesselFlightName(
      quote.transportMode === 'air' || quote.transportMode === 'express'
        ? 'Emirates SkyCargo EK-501 (Boeing 777F)'
        : 'CMA CGM Jacques Saadé (Voyage 2604W)'
    );
  };

  const calculatedNewTotal = editedBaseFreight + editedBaf + editedThc + editedDocumentation;
  const isModified =
    selectedQuote &&
    (editedBaseFreight !== selectedQuote.breakdown.baseFreightInr ||
      editedBaf !== selectedQuote.breakdown.fuelSurchargeInr ||
      editedThc !== selectedQuote.breakdown.terminalHandlingInr ||
      editedDocumentation !== selectedQuote.breakdown.documentationFeeInr);

  // Cross-reference carrier with Master Data
  const assignedCarrierName = selectedQuote?.assignedCarrier || 'Maersk Line';
  const registeredCarrier = carriers.find(
    (c) =>
      c.carrierName.toLowerCase().includes(assignedCarrierName.toLowerCase()) ||
      assignedCarrierName.toLowerCase().includes(c.carrierName.toLowerCase())
  );
  const isRegisteredInAdmin = Boolean(registeredCarrier);

  // Handle Document Approval / Rejection by Agent
  const handleUpdateDocumentStatus = (docId: string, status: 'approved' | 'rejected', notes?: string) => {
    if (!selectedQuote) return;
    const currentDocs = selectedQuote.tradeDocuments || [];
    const updatedDocs = currentDocs.map((doc) => {
      if (doc.id === docId) {
        return {
          ...doc,
          companyStatus: status,
          companyNotes: notes || (status === 'approved' ? 'Verified and accepted by Freight Agent' : 'Requires correction'),
        };
      }
      return doc;
    });

    const updatedQuote: SavedQuotation = {
      ...selectedQuote,
      tradeDocuments: updatedDocs,
    };
    onUpdateQuotation(updatedQuote);
  };

  const handleSendVerifiedToCustomer = (withRevisions: boolean, forwardToCustoms: boolean = false) => {
    if (!selectedQuote) return;
    setIsSubmitting(true);

    setTimeout(() => {
      const updatedBreakdown = {
        ...selectedQuote.breakdown,
        baseFreightInr: editedBaseFreight,
        fuelSurchargeInr: editedBaf,
        terminalHandlingInr: editedThc,
        documentationFeeInr: editedDocumentation,
        totalTariffInr: calculatedNewTotal,
      };

      const nextStatus = forwardToCustoms
        ? 'UNDER_CUSTOMS_REVIEW'
        : withRevisions || isModified
        ? 'AGENT_REVISED'
        : 'APPROVED';

      const updated: SavedQuotation = {
        ...selectedQuote,
        status: nextStatus,
        tariffAmount: calculatedNewTotal,
        breakdown: updatedBreakdown,
        freeDetentionDays,
        agentNotes:
          agentRevisionNotes ||
          (withRevisions
            ? 'Agent fine-tuned tariff lines and confirmed space allocation.'
            : 'Agent verified operational feasibility, equipment capacity, and trade documents.'),
        agentVerifiedAt: new Date().toISOString(),
        agentChecklist: Object.entries(checklistState).map(([item, status]) => ({
          id: item,
          name: item.toUpperCase(),
          status,
          verifiedAt: new Date().toISOString(),
        })),
        auditLogs: [
          ...(selectedQuote.auditLogs || []),
          {
            id: `AUD-${Date.now()}`,
            quoteId: selectedQuote.id,
            action: forwardToCustoms ? 'TRANSMITTED_TO_CUSTOMS' : withRevisions ? 'AGENT_REVISED' : 'AGENT_APPROVED',
            modifiedBy: 'dispatch.desk@carrier-agent.com',
            reason: forwardToCustoms
              ? 'Agent approved booking and forwarded documents to Indian Customs ICEGATE Portal'
              : agentRevisionNotes || 'Agent verified AI risk parameters, 4 trade documents, and tariff breakdown',
            previousValue: String(selectedQuote.tariffAmount),
            newValue: String(calculatedNewTotal),
            timestamp: new Date().toISOString(),
          },
        ],
      };

      onUpdateQuotation(updated);

      // Trigger notification to customer
      addNotification({
        targetRole: 'customer',
        quoteId: selectedQuote.id,
        title: forwardToCustoms
          ? 'Quotation Transmitted to Customs'
          : withRevisions
          ? 'Carrier Quotation Adjusted by Agent'
          : 'Carrier Quotation Verified & Approved',
        message: forwardToCustoms
          ? `Your booking ${selectedQuote.id} (${assignedCarrierName}) has been forwarded to Indian Customs for clearance approval.`
          : withRevisions
          ? `${assignedCarrierName} agent calibrated rates to ${formatCurrency(calculatedNewTotal, selectedQuote.currency)}. Booking allocation confirmed.`
          : `${assignedCarrierName} verified your quotation ${selectedQuote.id}. Review and confirm to proceed to Customs.`,
        type: 'action_required',
      });

      // If forwarded to customs, also notify customs officer
      if (forwardToCustoms) {
        addNotification({
          targetRole: 'customs-officer',
          quoteId: selectedQuote.id,
          title: `New Consignment Awaiting Clearance: ${selectedQuote.id}`,
          message: `Freight Agent verified documents for ${selectedQuote.companyName} (${selectedQuote.routeSummary}). Ready for statutory ICEGATE sign-off.`,
          type: 'action_required',
        });
      }

      setIsSubmitting(false);
      setSuccessToast(
        forwardToCustoms
          ? `Quotation ${selectedQuote.id} verified & transmitted to Indian Customs ICEGATE.`
          : `Quotation ${selectedQuote.id} successfully verified & sent to customer.`
      );
      setTimeout(() => setSuccessToast(null), 5000);
    }, 500);
  };

  const handleDownloadPDF = () => {
    if (!selectedQuote) return;
    generateQuotePDF(selectedQuote, `Carrier_Verification_${selectedQuote.id}_${selectedQuote.assignedCarrier || 'Carrier'}.pdf`);
  };

  const checklistItems = [
    { id: 'risk', label: '1. Risk Assessment', desc: 'Weather alerts, customs risk and corridor warnings checked' },
    { id: 'cargo', label: '2. Cargo Specifications', desc: 'Weight, volume, and special cargo packaging verified' },
    { id: 'validity', label: '3. Offer Validity', desc: 'Carrier rate contract active within 30-day window' },
    { id: 'documents', label: '4. Trade Documents', desc: '4 mandatory regulatory documents inspected and legible' },
    { id: 'schedule', label: '5. Schedule & Berth', desc: 'Vessel / flight departure window and ETA operational' },
    { id: 'capacity', label: '6. Equipment Capacity', desc: 'Container allocation confirmed with terminal gate' },
    { id: 'commercial', label: '7. Commercial Rates', desc: 'Base freight, bunker factors and port surcharges verified' },
    { id: 'route', label: '8. Routing Feasibility', desc: 'No active canal or maritime embargoes on transit corridor' },
    { id: 'shipment', label: '9. Consignment Match', desc: 'Origin, destination, and shipper declaration match' },
  ];

  const tradeDocs = selectedQuote?.tradeDocuments || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-400">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Industrial Freight Agent & Carrier Verification Desk</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Commercial Booking & Document Verification
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Exclusively registered shipping companies and airline carriers from the Admin Portal. Inspect genuine uploaded device trade documents, allocate vessel/flight space, calibrate commercial tariffs, and issue verified clearance dossiers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 bg-blue-500/20 text-blue-300 rounded-xl text-xs font-bold border border-blue-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{quotations.length} Live Quotations</span>
            </span>
          </div>
        </div>
      </div>

      {successToast && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center justify-between border border-emerald-500 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span className="text-xs font-bold">{successToast}</span>
          </div>
        </div>
      )}

      {/* Main Layout: Left Queue + Right Inspection & Editing Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Quotation Queue */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-500 px-1">
            <span>Pending Verifications ({quotations.length})</span>
            <span className="text-[10px] text-blue-600 font-bold font-mono">ADMIN VALIDATED</span>
          </div>

          {quotations.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
              <Ship className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="text-sm font-bold text-slate-800">No Quotations in Queue</div>
              <p className="text-xs text-slate-500">
                Customer quote selections will appear here automatically for agent review.
              </p>
            </div>
          ) : (
            quotations.map((q) => {
              const isSelected = selectedQuote?.id === q.id;
              const carrierObj = carriers.find(
                (c) =>
                  c.carrierName.toLowerCase().includes((q.assignedCarrier || '').toLowerCase()) ||
                  (q.assignedCarrier || '').toLowerCase().includes(c.carrierName.toLowerCase())
              );
              return (
                <div
                  key={q.id}
                  onClick={() => handleSelectQuote(q)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'bg-blue-50/60 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-slate-900">
                          {q.assignedCarrier || 'Registered Carrier'}
                        </span>
                        {carrierObj && (
                          <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                            ✓ Master
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {q.id} • {q.routeSummary}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        q.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : q.status === 'UNDER_CUSTOMS_REVIEW'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {q.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium">
                      {q.transportMode.toUpperCase()} • {q.tradeDocuments?.length || 0} Docs
                    </span>
                    <span className="font-extrabold text-slate-900">
                      {formatCurrency(q.tariffAmount, q.currency)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: AI Analysis + Document Check + Manual Tariff Adjustment */}
        <div className="lg:col-span-8">
          {selectedQuote ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              {/* Carrier Validation Badge & Shipper Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                      Carrier: {assignedCarrierName}
                    </span>
                    {isRegisteredInAdmin ? (
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Admin Master Data Registered (SCAC: {registeredCarrier?.carrierCode || 'ACT'})
                      </span>
                    ) : (
                      <span className="text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        Authorized Commercial Line
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-2">
                    Operational Verification & Commercial Clearance Desk
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Shipper: <span className="font-bold text-slate-800">{selectedQuote.companyName || selectedQuote.shipperName}</span> ({selectedQuote.shipperEmail}) • Route: <span className="font-bold text-slate-800">{selectedQuote.routeSummary}</span>
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Current Tariff Offer</div>
                  <div className="text-2xl font-black text-blue-600">
                    {formatCurrency(selectedQuote.tariffAmount, selectedQuote.currency)}
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5 text-slate-600" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* 1. AI RISK & BENCHMARK ASSESSMENT */}
              <div className="p-5 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 text-white rounded-3xl space-y-4 shadow-sm border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
                    <Sparkles className="w-4 h-4" />
                    <span>AI Multi-Model Operational Risk Assessment</span>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-lg text-[10px] font-mono font-bold border border-amber-500/30">
                    Composite Risk: 46 / 100 (NORMAL LANE)
                  </span>
                </div>

                {/* Risk Sub-metrics */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                    <div className="text-[10px] uppercase text-slate-400 font-bold">Weather Risk</div>
                    <div className="text-lg font-black text-amber-400 mt-0.5">38 / 100</div>
                    <div className="text-[9px] text-slate-400">Normal Swell</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                    <div className="text-[10px] uppercase text-slate-400 font-bold">Customs Risk</div>
                    <div className="text-lg font-black text-blue-400 mt-0.5">24 / 100</div>
                    <div className="text-[9px] text-slate-400">HS Compliant</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                    <div className="text-[10px] uppercase text-slate-400 font-bold">Route Risk</div>
                    <div className="text-lg font-black text-emerald-400 mt-0.5">18 / 100</div>
                    <div className="text-[9px] text-slate-400">Clear Corridor</div>
                  </div>
                </div>

                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">Carrier Space Allocation:</span> Equipment availability at origin terminal is confirmed. No active canal congestion or port embargoes currently reported on this corridor.
                  </div>
                </div>
              </div>

              {/* 2. REAL DEVICE TRADE DOCUMENTS INSPECTION & VERIFICATION */}
              <div className="space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Customer Uploaded Trade Documents (Device Files Only)</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {tradeDocs.length} Document(s) Attached
                  </span>
                </div>

                {tradeDocs.length === 0 ? (
                  <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-medium flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold">Awaiting Document Upload:</span> The customer has not attached device documents yet. As an agent, you can request re-upload or prompt the customer.
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {tradeDocs.map((doc) => {
                      const isApproved = doc.companyStatus === 'approved';
                      const isRejected = doc.companyStatus === 'rejected';
                      return (
                        <div
                          key={doc.id}
                          className={`p-4 rounded-2xl border transition-all space-y-3 ${
                            isApproved
                              ? 'bg-emerald-50/50 border-emerald-300'
                              : isRejected
                              ? 'bg-red-50/50 border-red-300'
                              : 'bg-slate-50/80 border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <FileText
                                className={`w-5 h-5 shrink-0 mt-0.5 ${
                                  isApproved ? 'text-emerald-600' : isRejected ? 'text-red-500' : 'text-blue-600'
                                }`}
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-slate-900 truncate">{doc.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {doc.size} • {doc.type.toUpperCase()} • Uploaded from device
                                </div>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 ${
                                isApproved
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isRejected
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Awaiting Review'}
                            </span>
                          </div>

                          {/* Action Buttons: Inspect & Verify */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-xs">
                            <button
                              type="button"
                              onClick={() => setViewingDoc(doc)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 rounded-lg border border-slate-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span>Inspect Document</span>
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateDocumentStatus(doc.id, 'approved')}
                                className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                                  isApproved
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300'
                                }`}
                              >
                                <Check className="w-3 h-3" />
                                <span>Verify</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateDocumentStatus(doc.id, 'rejected', 'Illegible or mismatch with cargo declaration')}
                                className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                                  isRejected
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white hover:bg-red-50 text-red-700 border border-red-300'
                                }`}
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. INDUSTRIAL ALLOCATION PARAMETERS (Vessel/Flight, Booking Ref, Detention Days) */}
              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Operational Allocation & Vessel Space Confirmation
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      {selectedQuote.transportMode === 'air' || selectedQuote.transportMode === 'express'
                        ? 'Flight / Aircraft Allocation'
                        : 'Vessel / Voyage Allocation'}
                    </label>
                    <input
                      type="text"
                      value={vesselFlightName}
                      onChange={(e) => setVesselFlightName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      Carrier Booking Reference
                    </label>
                    <input
                      type="text"
                      value={bookingRefNumber}
                      onChange={(e) => setBookingRefNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      Free Detention / Demurrage Days
                    </label>
                    <input
                      type="number"
                      min={7}
                      max={30}
                      value={freeDetentionDays}
                      onChange={(e) => setFreeDetentionDays(Number(e.target.value) || 14)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      Terminal Gate-in Cut-off
                    </label>
                    <input
                      type="datetime-local"
                      value={gateInCutoff}
                      onChange={(e) => setGateInCutoff(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* 4. 9-POINT OPERATIONAL CHECKLIST */}
              <div className="space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-slate-500">
                  9-Point Carrier Operational Checklist
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {checklistItems.map((item) => {
                    const isConfirmed = checklistState[item.id] === 'confirmed';
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          setChecklistState((prev) => ({
                            ...prev,
                            [item.id]: isConfirmed ? 'needs_attention' : 'confirmed',
                          }))
                        }
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isConfirmed
                            ? 'bg-emerald-50/50 border-emerald-300 text-emerald-950'
                            : 'bg-amber-50/50 border-amber-300 text-amber-950'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{item.label}</span>
                          {isConfirmed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                          )}
                        </div>
                        <p className="text-[10px] opacity-75 mt-0.5 line-clamp-1">{item.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. MANUAL RATE & TARIFF ADJUSTMENT WORKSPACE */}
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Rate Fine-Tuning & Tariff Override Desk
                    </span>
                  </div>
                  {isModified && (
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200 animate-pulse">
                      Tariff Revisions Pending
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      Base Freight (INR)
                    </label>
                    <input
                      type="number"
                      value={editedBaseFreight}
                      onChange={(e) => setEditedBaseFreight(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      Fuel Surcharge / BAF (INR)
                    </label>
                    <input
                      type="number"
                      value={editedBaf}
                      onChange={(e) => setEditedBaf(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      Terminal Handling (INR)
                    </label>
                    <input
                      type="number"
                      value={editedThc}
                      onChange={(e) => setEditedThc(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                      Doc & Clearance (INR)
                    </label>
                    <input
                      type="number"
                      value={editedDocumentation}
                      onChange={(e) => setEditedDocumentation(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Revision Notes Input */}
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                    Agent Remarks & Formal Allocation Notice
                  </label>
                  <input
                    type="text"
                    value={agentRevisionNotes}
                    onChange={(e) => setAgentRevisionNotes(e.target.value)}
                    placeholder="e.g. Allocation confirmed on vessel with 14 free detention days. Documents verified."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* Total Summary */}
                <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700">Verified Quotation Total:</span>
                  <div className="flex items-center gap-2">
                    {isModified && (
                      <span className="line-through text-slate-400 font-mono">
                        {formatCurrency(selectedQuote.tariffAmount, selectedQuote.currency)}
                      </span>
                    )}
                    <span className="text-base font-black text-blue-600">
                      {formatCurrency(calculatedNewTotal, selectedQuote.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Customer Approval & Customs Forwarding */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleSendVerifiedToCustomer(isModified, false)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Send to Shipper</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendVerifiedToCustomer(isModified, true)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Forward Directly to Customs Officer</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
              Select a quotation from the queue to start review and document verification.
            </div>
          )}
        </div>
      </div>

      {/* Document Inspection Modal */}
      {viewingDoc && (
        <DocumentViewerModal document={viewingDoc} onClose={() => setViewingDoc(null)} />
      )}
    </div>
  );
};
