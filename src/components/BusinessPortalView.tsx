import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  TrendingUp,
  DollarSign,
  Percent,
  Sliders,
  FileText,
  Ship,
  Plane,
  Truck,
  ArrowRight,
  Download,
  Eye,
  CheckCircle2,
  Search,
  Plus,
  Building,
  UserCheck,
  ShieldCheck,
  Globe,
  Tag,
  Zap,
  Calculator,
  RefreshCw,
  Edit3,
  Clock,
  Send,
  Award,
  Layers
} from 'lucide-react';
import { SavedQuotation, CarrierSpotRate, CommissionLedgerItem } from '../types';
import { formatCurrency } from '../utils/calculator';
import { generateQuotePDF } from '../utils/pdfGenerator';
import { PORTS_AND_HUBS } from '../data/freightData';
import { BrokerQuoteReviewModal } from './BrokerQuoteReviewModal';
import { Milestone2BrokerQuotationView } from './Milestone2BrokerQuotationView';
import { BusinessSidebarNav, BusinessTab } from './BusinessSidebarNav';
import { Milestone3RiskIntelligenceWorkspace } from './Milestone3RiskIntelligenceWorkspace';

interface BusinessPortalViewProps {
  quotations: SavedQuotation[];
  onViewQuotePDF: (quote: SavedQuotation) => void;
  onAddBrokerQuotation?: (quote: SavedQuotation) => void;
  onUpdateQuotation?: (quote: SavedQuotation) => void;
  userName?: string;
  userEmail?: string;
  businessSubTab?: BusinessTab;
  onSelectBusinessTab?: (tab: BusinessTab) => void;
}

const INITIAL_COMMISSION_LEDGER: CommissionLedgerItem[] = [
  {
    id: 'comm-801',
    shipmentRef: 'FH-Q-2026-8812',
    clientName: 'Apex Exports Pvt Ltd',
    route: 'INNSA -> AEJEA (Ocean 20GP)',
    carrier: 'Maersk Line',
    buyCostInr: 118000,
    sellPriceInr: 135700,
    marginPct: 15,
    commissionEarnedInr: 17700,
    status: 'SETTLED',
    date: '2026-08-11',
  },
  {
    id: 'comm-802',
    shipmentRef: 'FH-Q-2026-9045',
    clientName: 'Zenith Global Logistics',
    route: 'INNSA -> NLRTM (Ocean 40HC)',
    carrier: 'Hapag-Lloyd',
    buyCostInr: 295000,
    sellPriceInr: 339250,
    marginPct: 15,
    commissionEarnedInr: 44250,
    status: 'SETTLED',
    date: '2026-08-12',
  },
  {
    id: 'comm-803',
    shipmentRef: 'FH-Q-2026-9110',
    clientName: 'Reliance Polymers Exim',
    route: 'BOM -> DXB (Air Express)',
    carrier: 'Emirates SkyCargo',
    buyCostInr: 285000,
    sellPriceInr: 327750,
    marginPct: 15,
    commissionEarnedInr: 42750,
    status: 'PENDING_PAYOUT',
    date: '2026-08-13',
  },
  {
    id: 'comm-804',
    shipmentRef: 'FH-Q-2026-9284',
    clientName: 'Tata AutoComp Systems',
    route: 'INMAA -> SGSIN (Ocean 20GP)',
    carrier: 'CMA CGM',
    buyCostInr: 98000,
    sellPriceInr: 112700,
    marginPct: 15,
    commissionEarnedInr: 14700,
    status: 'IN_PROCESSING',
    date: '2026-08-14',
  },
];

export const BusinessPortalView: React.FC<BusinessPortalViewProps> = ({
  quotations = [],
  onViewQuotePDF,
  onAddBrokerQuotation,
  onUpdateQuotation,
  userName = 'Commercial Manager',
  userEmail = 'business@freighthub.com',
  businessSubTab = 'overview',
  onSelectBusinessTab,
}) => {
  const [internalTab, setInternalTab] = useState<BusinessTab>(businessSubTab);

  const activeTab = businessSubTab || internalTab;
  const handleTabChange = (tab: BusinessTab) => {
    setInternalTab(tab);
    if (onSelectBusinessTab) onSelectBusinessTab(tab);
  };

  // Review Modal State for Shipper Quotes
  const [reviewModalQuote, setReviewModalQuote] = useState<SavedQuotation | null>(null);
  const [quoteSearchTerm, setQuoteSearchTerm] = useState('');
  const [quoteFilterStatus, setQuoteFilterStatus] = useState<'ALL' | 'PENDING' | 'FINALIZED'>('ALL');

  // Business Margin Generator State
  const [clientCompanyName, setClientCompanyName] = useState('Supreme Textiles Export Corp');
  const [clientContactPerson, setClientContactPerson] = useState('Rajesh Sharma');
  const [clientEmail, setClientEmail] = useState('r.sharma@supremetextiles.in');
  const [originPort, setOriginPort] = useState('INNSA');
  const [destinationPort, setDestinationPort] = useState('AEJEA');
  const [transportMode, setTransportMode] = useState<'ocean' | 'air' | 'ground'>('ocean');
  const [containerSpec, setContainerSpec] = useState<'20GP' | '40HC' | 'LCL_SLOT'>('20GP');
  const [containerCount, setContainerCount] = useState(1);
  const [carrierSelected, setCarrierSelected] = useState('Maersk Line');
  const [carrierBuyBase, setCarrierBuyBase] = useState(118000);
  const [brokerMarginPct, setBrokerMarginPct] = useState(14); // 14% commercial margin
  const [customsHandlingFee, setCustomsHandlingFee] = useState(6500);
  const [brokerNote, setBrokerNote] = useState('Commercial tariff tier with dedicated customs handling included.');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Calculations for Margin Studio
  const baseTotalBuyCost = carrierBuyBase * containerCount;
  const grossMarginAmount = Math.round((baseTotalBuyCost * brokerMarginPct) / 100);
  const clientFinalSellPrice = baseTotalBuyCost + grossMarginAmount + customsHandlingFee;

  const handleIssueCommercialQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const newQuoteId = `FH-BIZ-${Date.now().toString().slice(-4)}`;
    const originHub = PORTS_AND_HUBS.find((p) => p.code === originPort);
    const destHub = PORTS_AND_HUBS.find((p) => p.code === destinationPort);

    const newQuotation: SavedQuotation = {
      id: newQuoteId,
      shipperName: clientContactPerson,
      companyName: clientCompanyName,
      routeSummary: `${originHub?.city || originPort} (${originPort}) -> ${destHub?.city || destinationPort} (${destinationPort})`,
      originCode: originPort,
      destinationCode: destinationPort,
      transportMode,
      oceanLoadType: transportMode === 'ocean' ? 'FCL' : undefined,
      tariffAmount: clientFinalSellPrice,
      currency: 'INR',
      status: 'ISSUED',
      validUntil: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      cargoSummary: `${containerCount}x ${containerSpec} (${transportMode.toUpperCase()}) via ${carrierSelected}`,
      breakdown: {
        baseTariff: baseTotalBuyCost,
        bafFuelSurcharge: Math.round(baseTotalBuyCost * 0.1),
        terminalHandlingCharge: Math.round(baseTotalBuyCost * 0.05),
        documentationFee: customsHandlingFee,
        specialHandlingSurcharge: grossMarginAmount,
        insuranceFee: 0,
        discountAmount: 0,
        subtotal: baseTotalBuyCost + grossMarginAmount + customsHandlingFee,
        estimatedTax: Math.round((baseTotalBuyCost + grossMarginAmount + customsHandlingFee) * 0.05),
        grandTotal: clientFinalSellPrice,
        currency: 'INR',
        chargeBasis: `Commercial Rate (${brokerMarginPct}% Margin) - ${carrierSelected}`,
        cargoCountSummary: `${containerCount} Unit(s) / Container(s)`,
        totalWeightKg: containerCount * 14000,
        estimatedDistanceNmOrKm: '1,500 nm',
        estimatedTransitDays: '5-8 Days',
        estimatedArrivalDate: new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0],
      },
      formData: {
        originPortCode: originPort,
        destinationPortCode: destinationPort,
        pickupHubId: '',
        deliveryHubId: '',
        cargoReadyDate: new Date().toISOString().split('T')[0],
        requiredDeliveryDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
        transportMode,
        oceanLoadType: 'FCL',
        incoterm: 'FOB',
        cargoItems: [],
        declaredValue: 2500000,
        currency: 'INR',
        specialInstructions: brokerNote,
        fragileGoods: false,
        hazardousMaterials: false,
        temperatureControlled: false,
        addCargoInsurance: false,
        promoCodeApplied: null,
        fullName: clientContactPerson,
        companyName: clientCompanyName,
        email: clientEmail,
        country: 'India',
      },
      brokerReviewed: true,
      isBrokerEdited: true,
      brokerMarginPct,
      brokerProfitInr: grossMarginAmount,
      assignedCarrier: carrierSelected,
      brokerReviewNotes: brokerNote,
    };

    if (onAddBrokerQuotation) {
      onAddBrokerQuotation(newQuotation);
    }

    setSuccessBanner(`Commercial Quote ${newQuoteId} for ${clientCompanyName} generated and approved!`);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  // Filtered Quotations
  const filteredQuotations = useMemo(() => {
    const term = quoteSearchTerm.trim().toLowerCase();
    return (quotations || []).filter((q) => {
      const matchesSearch =
        !term ||
        (q.id || '').toLowerCase().includes(term) ||
        (q.shipperName || '').toLowerCase().includes(term) ||
        (q.companyName || '').toLowerCase().includes(term) ||
        (q.routeSummary || '').toLowerCase().includes(term);

      const matchesStatus =
        quoteFilterStatus === 'ALL' ||
        (quoteFilterStatus === 'PENDING' && !q.brokerReviewed) ||
        (quoteFilterStatus === 'FINALIZED' && q.brokerReviewed);

      return matchesSearch && matchesStatus;
    });
  }, [quotations, quoteSearchTerm, quoteFilterStatus]);

  // Financial KPI calculations
  const totalVolumeInr = (quotations || []).reduce((sum, q) => sum + (q.tariffAmount || 0), 0);
  const totalMarginProfit = (quotations || []).reduce((sum, q) => sum + (q.brokerProfitInr || ((q.tariffAmount || 0) * 0.12)), 0);
  const pendingApprovalsCount = (quotations || []).filter((q) => !q.brokerReviewed && q.status !== 'BROKER_FINALIZED' && q.status !== 'ACCEPTED').length;

  // 1-Click Quick Approval Handler
  const handleQuickApprove = (q: SavedQuotation) => {
    const defaultMarginPct = 12;
    const baseBuy = q.breakdown?.baseTariff || Math.round((q.tariffAmount || 0) * 0.8);
    const profit = Math.round(baseBuy * (defaultMarginPct / 100));
    const subtotal = (q.breakdown?.subtotal || q.tariffAmount || 0) + profit;
    const estimatedGst = Math.round(subtotal * 0.05);
    const grandTotal = subtotal + estimatedGst;

    const approvedQuote: SavedQuotation = {
      ...q,
      tariffAmount: grandTotal,
      status: 'BROKER_FINALIZED',
      brokerReviewed: true,
      isBrokerEdited: true,
      brokerMarginPct: defaultMarginPct,
      brokerProfitInr: profit,
      assignedCarrier: q.assignedCarrier || 'Maersk Line Direct Service',
      brokerReviewNotes: 'Commercial tariff approved by Business Pricing Desk with standard 12% margin tier.',
      brokerAdjustedAt: new Date().toISOString(),
      breakdown: {
        ...q.breakdown,
        specialHandlingSurcharge: profit,
        subtotal,
        estimatedTax: estimatedGst,
        grandTotal,
        chargeBasis: `Commercial Desk Approved (Margin: ${defaultMarginPct}%) - Carrier: ${q.assignedCarrier || 'Maersk Line'}`,
      },
    };

    if (onUpdateQuotation) {
      onUpdateQuotation(approvedQuote);
    }
    setSuccessBanner(`Quotation ${q.id} approved instantly! 12% commercial margin added, dispatched to shipper.`);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  // Batch approve all pending quotes
  const handleBatchApproveAll = () => {
    const pendingQuotes = (quotations || []).filter((q) => !q.brokerReviewed && q.status !== 'BROKER_FINALIZED' && q.status !== 'ACCEPTED');
    if (pendingQuotes.length === 0) return;

    pendingQuotes.forEach((q) => {
      handleQuickApprove(q);
    });
    setSuccessBanner(`Successfully batch-approved ${pendingQuotes.length} pending quotation(s)!`);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Review Modal for adjustments */}
      {reviewModalQuote && (
        <BrokerQuoteReviewModal
          quote={reviewModalQuote}
          isOpen={!!reviewModalQuote}
          onClose={() => setReviewModalQuote(null)}
          onSaveQuote={(updated) => {
            if (onUpdateQuotation) onUpdateQuotation(updated);
            setReviewModalQuote(null);
            setSuccessBanner(`Quotation ${updated.id} successfully reviewed, margin applied, and dispatched to shipper!`);
            setTimeout(() => setSuccessBanner(null), 5000);
          }}
          onSaveAndDispatch={(updated) => {
            if (onUpdateQuotation) onUpdateQuotation(updated);
            setReviewModalQuote(null);
            setSuccessBanner(`Quotation ${updated.id} successfully reviewed, margin applied, and dispatched to shipper!`);
            setTimeout(() => setSuccessBanner(null), 5000);
          }}
          onSave={(updated) => {
            if (onUpdateQuotation) onUpdateQuotation(updated);
            setReviewModalQuote(null);
            setSuccessBanner(`Quotation ${updated.id} successfully reviewed, margin applied, and dispatched to shipper!`);
            setTimeout(() => setSuccessBanner(null), 5000);
          }}
        />
      )}

      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20">
              <Briefcase className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                  Commercial Business Portal
                </span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                  Revenue & Yield Center
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Margin Governance & Pricing Desk
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Logged in as <span className="font-bold text-slate-800">{userName}</span> ({userEmail}) • Commercial Strategy Desk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTabChange('margin-calculator')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <Sliders className="w-4 h-4" />
              <span>Launch Margin Studio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Business Layout (Sidebar + Content) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar Navigation */}
        <div className="lg:col-span-3 lg:sticky lg:top-20 z-10">
          <BusinessSidebarNav
            activeTab={activeTab}
            onSelectTab={handleTabChange}
            quotationsCount={quotations.length}
          />
        </div>

        {/* Right Content View */}
        <div className="lg:col-span-9 space-y-6">
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Total Quoted Volume</span>
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {formatCurrency(totalVolumeInr, 'INR')}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <span>+18.4%</span> vs last month
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Gross Commercial Profit</span>
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black text-emerald-600 tracking-tight">
                    {formatCurrency(totalMarginProfit, 'INR')}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Avg markup yield: <strong>14.2%</strong>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Active Shipper Quotes</span>
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {quotations.length}
                  </div>
                  <div className="text-[11px] text-blue-600 font-medium">
                    {pendingApprovalsCount} awaiting commercial sign-off
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Settled Commission</span>
                    <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-2xl font-black text-purple-600 tracking-tight">
                    {formatCurrency(61950, 'INR')}
                  </div>
                  <div className="text-[11px] text-purple-700 font-medium">
                    4 settlements processed
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Pipeline */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Shipper Quotation Queue ({quotations.length})
                    </h3>
                    <button
                      onClick={() => handleTabChange('client-quotes')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {quotations.slice(0, 4).map((q) => (
                      <div
                        key={q.id}
                        className="p-3.5 bg-slate-50 hover:bg-indigo-50/50 rounded-2xl border border-slate-200 flex items-center justify-between transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-slate-900">{q.id}</span>
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-bold uppercase">
                              {q.transportMode}
                            </span>
                            {q.brokerReviewed || q.status === 'BROKER_FINALIZED' || q.status === 'ACCEPTED' ? (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                                Approved
                              </span>
                            ) : (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold">
                                Pending Approval
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 font-medium mt-0.5">
                            {q.companyName || q.shipperName} • {q.routeSummary}
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <div className="font-black text-xs text-slate-900">
                              {formatCurrency(q.tariffAmount, q.currency)}
                            </div>
                            <button
                              onClick={() => setReviewModalQuote(q)}
                              className="text-[11px] font-bold text-indigo-600 hover:underline block"
                            >
                              Review & Margin
                            </button>
                          </div>
                          {!q.brokerReviewed && q.status !== 'BROKER_FINALIZED' && q.status !== 'ACCEPTED' && (
                            <button
                              onClick={() => handleQuickApprove(q)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                              title="Approve immediately with 12% standard margin"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-xl space-y-4">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                    <Zap className="w-4 h-4" />
                    <span>Commercial Markups</span>
                  </div>
                  <h3 className="text-lg font-black text-white">Tier-Based Pricing Rules</h3>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white">Enterprise Tier A</div>
                        <div className="text-[10px] text-slate-400">&gt; 50 TEU / month</div>
                      </div>
                      <span className="font-black text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
                        8% Margin
                      </span>
                    </div>

                    <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white">Standard Commercial Tier</div>
                        <div className="text-[10px] text-slate-400">Regular FCL/LCL Exporters</div>
                      </div>
                      <span className="font-black text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-800">
                        14% Margin
                      </span>
                    </div>

                    <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white">Spot / Ad-Hoc Shipper</div>
                        <div className="text-[10px] text-slate-400">Single consignment bookings</div>
                      </div>
                      <span className="font-black text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800">
                        18% Margin
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MARGIN STUDIO */}
          {activeTab === 'margin-calculator' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {successBanner && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>{successBanner}</span>
                  </div>
                  <button
                    onClick={() => handleTabChange('client-quotes')}
                    className="px-3 py-1 bg-emerald-700 text-white rounded-lg text-xs hover:bg-emerald-800"
                  >
                    View in Quotes Desk
                  </button>
                </div>
              )}

              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      Commercial Margin & Quotation Studio
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure carrier buy base, adjust margin percentage, and generate finalized commercial quotations for shippers.
                    </p>
                  </div>
                  <span className="text-[11px] bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full border border-indigo-200">
                    Live Calculation
                  </span>
                </div>

                <form onSubmit={handleIssueCommercialQuote} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Client Company Name *
                      </label>
                      <input
                        type="text"
                        value={clientCompanyName}
                        onChange={(e) => setClientCompanyName(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Contact Person *
                      </label>
                      <input
                        type="text"
                        value={clientContactPerson}
                        onChange={(e) => setClientContactPerson(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Client Email *
                      </label>
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Origin Port / Hub
                      </label>
                      <select
                        value={originPort}
                        onChange={(e) => setOriginPort(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none"
                      >
                        {PORTS_AND_HUBS.map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.code} - {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Destination Port / Hub
                      </label>
                      <select
                        value={destinationPort}
                        onChange={(e) => setDestinationPort(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none"
                      >
                        {PORTS_AND_HUBS.map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.code} - {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Transport Mode
                      </label>
                      <select
                        value={transportMode}
                        onChange={(e) => setTransportMode(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none"
                      >
                        <option value="ocean">Ocean Freight</option>
                        <option value="air">Air Cargo Express</option>
                        <option value="ground">Ground Transport</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Equipment / Container
                      </label>
                      <select
                        value={containerSpec}
                        onChange={(e) => setContainerSpec(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none"
                      >
                        <option value="20GP">20GP Standard Container</option>
                        <option value="40HC">40HC High Cube Container</option>
                        <option value="LCL_SLOT">LCL Consolidated Cargo</option>
                      </select>
                    </div>
                  </div>

                  {/* Financial Inputs & Margin Slider */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-5">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Percent className="w-4 h-4 text-indigo-600" />
                      <span>Commercial Rate Breakdown & Margin Controls</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          Carrier Buy Base Cost (₹ / Unit)
                        </label>
                        <input
                          type="number"
                          value={carrierBuyBase}
                          onChange={(e) => setCarrierBuyBase(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-600 uppercase">
                            Commercial Markup Margin %
                          </label>
                          <span className="text-xs font-black text-indigo-600">{brokerMarginPct}%</span>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max="35"
                          step="0.5"
                          value={brokerMarginPct}
                          onChange={(e) => setBrokerMarginPct(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                          <span>2% (Min)</span>
                          <span>14% (Standard)</span>
                          <span>35% (Max)</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          Customs & Handling Fee (₹)
                        </label>
                        <input
                          type="number"
                          value={customsHandlingFee}
                          onChange={(e) => setCustomsHandlingFee(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Computed Summary Box */}
                    <div className="bg-white p-4 rounded-xl border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">Net Margin Profit:</span>
                        <div className="text-lg font-black text-emerald-600">
                          {formatCurrency(grossMarginAmount, 'INR')}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Final Shipper Sell Price:</span>
                        <div className="text-2xl font-black text-indigo-900">
                          {formatCurrency(clientFinalSellPrice, 'INR')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
                    >
                      <Send className="w-4 h-4" />
                      <span>Issue Commercial Quotation</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: COMMERCIAL PRICING DESK */}
          {activeTab === 'commercial-pricing' && (
            <Milestone2BrokerQuotationView />
          )}

          {/* TAB 4: RISK & CUSTOMS INTELLIGENCE (MIGRATED TO BUSINESS PORTAL) */}
          {activeTab === 'risk-customs' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Commercial Risk & Customs Desk
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Live 5-Pillar Engine
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
                      Risk, Customs & Marine Weather Intelligence
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 max-w-3xl">
                      Evaluate multi-corridor composite disruption risks, regulatory CBIC/DGFT requirements, tariff HS classifications, NOAA storm buffers, and machine learning rate variances to price and approve client consignments safely.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleTabChange('margin-calculator')}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Back to Margin Studio</span>
                    </button>
                    <button
                      onClick={() => handleTabChange('client-quotes')}
                      className="px-3.5 py-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Review Client Quotes</span>
                    </button>
                  </div>
                </div>

                {/* Embedded Full Suite */}
                <div className="pt-2">
                  <Milestone3RiskIntelligenceWorkspace
                    initialTab="risk-engine"
                    userRole="business"
                    userEmail={userEmail}
                    onOpenQuoteBuilder={() => handleTabChange('margin-calculator')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SHIPPER QUOTE APPROVALS */}
          {activeTab === 'client-quotes' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Shipper Quotation Approvals & Review
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live database of all quotation requests generated by shippers. Apply custom margins and approve directly.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {pendingApprovalsCount > 0 && (
                    <button
                      onClick={handleBatchApproveAll}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Batch Approve All ({pendingApprovalsCount})</span>
                    </button>
                  )}

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search quote or shipper..."
                      value={quoteSearchTerm}
                      onChange={(e) => setQuoteSearchTerm(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <select
                    value={quoteFilterStatus}
                    onChange={(e) => setQuoteFilterStatus(e.target.value as any)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none"
                  >
                    <option value="ALL">All Quotes ({quotations.length})</option>
                    <option value="PENDING">Pending Review ({pendingApprovalsCount})</option>
                    <option value="FINALIZED">Approved ({quotations.length - pendingApprovalsCount})</option>
                  </select>
                </div>
              </div>

              {/* Quotations Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Quote ID</th>
                      <th className="p-3.5">Shipper / Company</th>
                      <th className="p-3.5">Corridor Route</th>
                      <th className="p-3.5">Mode</th>
                      <th className="p-3.5 text-right">Tariff Amount</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredQuotations.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-bold text-indigo-700 font-mono">{q.id}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{q.companyName || q.shipperName}</div>
                          <div className="text-[10px] text-slate-400">{q.shipperName}</div>
                        </td>
                        <td className="p-3.5 text-slate-700 font-mono text-[11px]">{q.routeSummary}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                            {q.transportMode}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-black text-slate-900">
                          {formatCurrency(q.tariffAmount, q.currency)}
                        </td>
                        <td className="p-3.5 text-center">
                          {q.status === 'ACCEPTED' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Shipper Accepted
                            </span>
                          ) : q.brokerReviewed || q.status === 'BROKER_FINALIZED' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                              Desk Approved
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                              Pending Review
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!q.brokerReviewed && q.status !== 'BROKER_FINALIZED' && q.status !== 'ACCEPTED' && (
                              <button
                                onClick={() => handleQuickApprove(q)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                                title="1-Click Approve with 12% margin"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                            )}
                            <button
                              onClick={() => setReviewModalQuote(q)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs cursor-pointer"
                            >
                              {q.brokerReviewed ? 'Adjust' : 'Review'}
                            </button>
                            <button
                              onClick={() => onViewQuotePDF(q)}
                              className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: COMMISSION & SETTLEMENTS */}
          {activeTab === 'commission-ledger' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Commission Payouts & Settlement Ledger
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audited commercial profit shares and automated payout disbursement records.
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Ref ID</th>
                      <th className="p-3.5">Client & Route</th>
                      <th className="p-3.5">Carrier</th>
                      <th className="p-3.5 text-right">Buy Cost</th>
                      <th className="p-3.5 text-right">Sell Price</th>
                      <th className="p-3.5 text-right">Profit Earned</th>
                      <th className="p-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {INITIAL_COMMISSION_LEDGER.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-bold font-mono text-slate-900">{c.shipmentRef}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{c.clientName}</div>
                          <div className="text-[10px] text-slate-500">{c.route}</div>
                        </td>
                        <td className="p-3.5 text-slate-700">{c.carrier}</td>
                        <td className="p-3.5 text-right font-mono">{formatCurrency(c.buyCostInr, 'INR')}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(c.sellPriceInr, 'INR')}
                        </td>
                        <td className="p-3.5 text-right font-mono font-black text-emerald-600">
                          {formatCurrency(c.commissionEarnedInr, 'INR')}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              c.status === 'SETTLED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
