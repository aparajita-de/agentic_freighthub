import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  Compass
} from 'lucide-react';
import { SavedQuotation, CarrierSpotRate, CommissionLedgerItem } from '../types';
import { formatCurrency } from '../utils/calculator';
import { generateQuotePDF } from '../utils/pdfGenerator';
import { PORTS_AND_HUBS } from '../data/freightData';
import { BrokerQuoteReviewModal } from './BrokerQuoteReviewModal';
import { Milestone1RouteOperationsView } from './Milestone1RouteOperationsView';
import { Milestone2BrokerQuotationView } from './Milestone2BrokerQuotationView';
import { BrokerSidebarNav, BrokerTab } from './BrokerSidebarNav';
import { ShipmentRecord } from '../data/shipmentData';
import { TrackingView } from './TrackingView';

interface BrokerPortalViewProps {
  quotations: SavedQuotation[];
  onViewQuotePDF: (quote: SavedQuotation) => void;
  onAddBrokerQuotation?: (quote: SavedQuotation) => void;
  onUpdateQuotation?: (quote: SavedQuotation) => void;
  brokerName?: string;
  brokerEmail?: string;
  brokerSubTab?: BrokerTab;
  onSelectBrokerTab?: (tab: BrokerTab) => void;
}

const INITIAL_SPOT_RATES: CarrierSpotRate[] = [
  {
    id: 'spot-101',
    carrierName: 'Maersk Line',
    originPort: 'INNSA',
    destinationPort: 'AEJEA',
    mode: 'ocean',
    equipment: '20GP Container',
    buyRateInr: 118000,
    suggestedSellInr: 135000,
    transitDays: 5,
    validUntil: '2026-08-31',
    spaceAvailability: 'High',
    reliabilityScore: '96%',
    directOrTranshipment: 'Direct Express Line',
  },
  {
    id: 'spot-102',
    carrierName: 'MSC Mediterranean',
    originPort: 'INNSA',
    destinationPort: 'AEJEA',
    mode: 'ocean',
    equipment: '40HC Container',
    buyRateInr: 185000,
    suggestedSellInr: 215000,
    transitDays: 6,
    validUntil: '2026-08-30',
    spaceAvailability: 'High',
    reliabilityScore: '94%',
    directOrTranshipment: 'Direct Service',
  },
  {
    id: 'spot-103',
    carrierName: 'CMA CGM',
    originPort: 'INMAA',
    destinationPort: 'SGSIN',
    mode: 'ocean',
    equipment: '20GP Container',
    buyRateInr: 98000,
    suggestedSellInr: 114000,
    transitDays: 7,
    validUntil: '2026-09-05',
    spaceAvailability: 'Medium',
    reliabilityScore: '92%',
    directOrTranshipment: 'Via Port Klang (MYPKG)',
  },
  {
    id: 'spot-104',
    carrierName: 'Hapag-Lloyd',
    originPort: 'INNSA',
    destinationPort: 'NLRTM',
    mode: 'ocean',
    equipment: '40HC Container',
    buyRateInr: 295000,
    suggestedSellInr: 340000,
    transitDays: 22,
    validUntil: '2026-08-28',
    spaceAvailability: 'Medium',
    reliabilityScore: '95%',
    directOrTranshipment: 'Via Jebel Ali (AEJEA)',
  },
  {
    id: 'spot-105',
    carrierName: 'Emirates SkyCargo',
    originPort: 'BOM',
    destinationPort: 'DXB',
    mode: 'air',
    equipment: 'ULD Air Pallet (1500kg)',
    buyRateInr: 285000,
    suggestedSellInr: 335000,
    transitDays: 1,
    validUntil: '2026-08-25',
    spaceAvailability: 'High',
    reliabilityScore: '99%',
    directOrTranshipment: 'Direct Daily Flight',
  },
  {
    id: 'spot-106',
    carrierName: 'Qatar Airways Cargo',
    originPort: 'DEL',
    destinationPort: 'LHR',
    mode: 'air',
    equipment: 'Air Cargo Loose (1200kg)',
    buyRateInr: 390000,
    suggestedSellInr: 450000,
    transitDays: 2,
    validUntil: '2026-08-27',
    spaceAvailability: 'Tight',
    reliabilityScore: '97%',
    directOrTranshipment: 'Via Hamad Intl (DOH)',
  },
];

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

export const BrokerPortalView: React.FC<BrokerPortalViewProps> = ({
  quotations = [],
  onViewQuotePDF,
  onAddBrokerQuotation,
  onUpdateQuotation,
  brokerName = 'Freight Broker Partner',
  brokerEmail = 'broker@freighthub.com',
  brokerSubTab,
  onSelectBrokerTab,
}) => {
  const [internalTab, setInternalTab] = useState<'overview' | 'margin-calculator' | 'client-quotes' | 'carrier-rates' | 'commission-ledger' | 'm1-routes' | 'm2-quotes'>('overview');

  // Synchronize internal tab if parent passes brokerSubTab
  useEffect(() => {
    if (brokerSubTab) {
      if (brokerSubTab === 'margin-calculator' || brokerSubTab === 'client-quotes' || brokerSubTab === 'carrier-rates' || brokerSubTab === 'commissions' || brokerSubTab === 'overview' || brokerSubTab === 'm1-routes' || brokerSubTab === 'm2-quotes') {
        const mappedTab = brokerSubTab === 'commissions' ? 'commission-ledger' : brokerSubTab;
        setInternalTab(mappedTab as any);
      }
    }
  }, [brokerSubTab]);

  const activeTab = internalTab;
  const handleTabChange = useCallback((tab: 'overview' | 'margin-calculator' | 'client-quotes' | 'carrier-rates' | 'commission-ledger' | 'm1-routes' | 'm2-quotes') => {
    setInternalTab(tab);
    if (onSelectBrokerTab) {
      const mappedExternal = tab === 'commission-ledger' ? 'commissions' : tab;
      onSelectBrokerTab(mappedExternal as any);
    }
  }, [onSelectBrokerTab]);

  // Review & Adjust Modal State
  const [reviewModalQuote, setReviewModalQuote] = useState<SavedQuotation | null>(null);

  // Filter in client quotes
  const [quoteFilterStatus, setQuoteFilterStatus] = useState<'ALL' | 'PENDING' | 'FINALIZED'>('ALL');

  // Broker Quote Form State
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
  const [brokerMarginPct, setBrokerMarginPct] = useState(12); // default 12% broker margin
  const [customsHandlingFee, setCustomsHandlingFee] = useState(6500);
  const [brokerNote, setBrokerNote] = useState('Includes dedicated CFS handling and export clearance supervision.');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Search in client quotes
  const [quoteSearchTerm, setQuoteSearchTerm] = useState('');

  // Memoized Filtered Client Quotations for maximum performance and instant search/filtering
  const filteredQuotations = useMemo(() => {
    const term = quoteSearchTerm.trim().toLowerCase();
    return (quotations || []).filter((q) => {
      if (quoteFilterStatus === 'PENDING' && q.status !== 'PENDING_BROKER_REVIEW') {
        return false;
      }
      if (quoteFilterStatus === 'FINALIZED' && (q.status !== 'BROKER_FINALIZED' && q.status !== 'ISSUED')) {
        return false;
      }
      if (!term) return true;
      return (
        (q.id || '').toLowerCase().includes(term) ||
        (q.companyName || '').toLowerCase().includes(term) ||
        (q.shipperName || '').toLowerCase().includes(term) ||
        (q.routeSummary || '').toLowerCase().includes(term)
      );
    });
  }, [quotations, quoteFilterStatus, quoteSearchTerm]);

  // Calculations for Broker Margin Studio
  const brokerCalculations = useMemo(() => {
    const buySubtotal = carrierBuyBase * containerCount;
    const bafFuel = Math.round(buySubtotal * 0.12);
    const terminalHandling = Math.round(buySubtotal * 0.08);
    const totalCarrierCost = buySubtotal + bafFuel + terminalHandling;
    const marginAmount = Math.round(totalCarrierCost * (brokerMarginPct / 100));
    const subtotalClient = totalCarrierCost + marginAmount + customsHandlingFee;
    const gstTax = Math.round(subtotalClient * 0.05); // 5% GST on commercial freight
    const finalClientPrice = subtotalClient + gstTax;

    return {
      buySubtotal,
      bafFuel,
      terminalHandling,
      totalCarrierCost,
      marginAmount,
      customsHandlingFee,
      subtotalClient,
      gstTax,
      finalClientPrice,
    };
  }, [carrierBuyBase, containerCount, brokerMarginPct, customsHandlingFee]);

  // Aggregate Broker Metrics
  const totalBrokerageCommission = useMemo(() => {
    return INITIAL_COMMISSION_LEDGER.reduce((acc, item) => acc + item.commissionEarnedInr, 0);
  }, []);

  const totalManagedVolume = useMemo(() => {
    return INITIAL_COMMISSION_LEDGER.reduce((acc, item) => acc + item.sellPriceInr, 0);
  }, []);

  // Handle Carrier Spot Rate Selection
  const handleSelectCarrierSpot = useCallback((rate: CarrierSpotRate) => {
    setCarrierSelected(rate.carrierName);
    setCarrierBuyBase(rate.buyRateInr);
    setOriginPort(rate.originPort);
    setDestinationPort(rate.destinationPort);
    setTransportMode(rate.mode);
    handleTabChange('margin-calculator');
    setSuccessBanner(`Applied spot rate from ${rate.carrierName} (${formatCurrency(rate.buyRateInr, 'INR')}) to Broker Margin Studio!`);
    setTimeout(() => setSuccessBanner(null), 5000);
  }, [handleTabChange]);

  // Handle Issuing a Broker Quotation to Shipper Client
  const handleIssueBrokerQuote = (e: React.FormEvent) => {
    e.preventDefault();

    const originHub = PORTS_AND_HUBS.find((p) => p.code === originPort);
    const destHub = PORTS_AND_HUBS.find((p) => p.code === destinationPort);
    const newQuoteId = `FH-BRK-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBrokerQuote: SavedQuotation = {
      id: newQuoteId,
      shipperName: clientContactPerson,
      companyName: clientCompanyName,
      routeSummary: `${originHub?.city || originPort} (${originPort}) -> ${destHub?.city || destinationPort} (${destinationPort})`,
      originCode: originPort,
      destinationCode: destinationPort,
      transportMode: transportMode,
      oceanLoadType: transportMode === 'ocean' ? 'FCL' : undefined,
      tariffAmount: brokerCalculations.finalClientPrice,
      currency: 'INR',
      status: 'ISSUED',
      createdAt: new Date().toISOString().split('T')[0],
      cargoSummary: `${containerCount}x ${containerSpec} (${transportMode.toUpperCase()}) via ${carrierSelected}`,
      breakdown: {
        baseTariff: brokerCalculations.buySubtotal,
        bafFuelSurcharge: brokerCalculations.bafFuel,
        terminalHandlingCharge: brokerCalculations.terminalHandling,
        documentationFee: brokerCalculations.customsHandlingFee,
        specialHandlingSurcharge: brokerCalculations.marginAmount, // broker margin
        insuranceFee: 0,
        discountAmount: 0,
        subtotal: brokerCalculations.subtotalClient,
        estimatedTax: brokerCalculations.gstTax,
        grandTotal: brokerCalculations.finalClientPrice,
        currency: 'INR',
        chargeBasis: `Brokerage Approved Rate (${brokerMarginPct}% Spread) - Carrier: ${carrierSelected}`,
        cargoCountSummary: `${containerCount} Container(s) / Pallet(s)`,
        totalWeightKg: containerCount * 14000,
        estimatedDistanceNmOrKm: '1,500 nm',
        estimatedTransitDays: '4-7 Days',
        estimatedArrivalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      formData: {
        originPortCode: originPort,
        destinationPortCode: destinationPort,
        pickupHubId: '',
        deliveryHubId: '',
        cargoReadyDate: new Date().toISOString().split('T')[0],
        requiredDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        transportMode: transportMode,
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
    };

    if (onAddBrokerQuotation) {
      onAddBrokerQuotation(newBrokerQuote);
    }

    setSuccessBanner(`Broker Quote ${newQuoteId} issued successfully for ${clientCompanyName}! Final Client Price: ${formatCurrency(brokerCalculations.finalClientPrice, 'INR')} (Broker Spread Profit: ${formatCurrency(brokerCalculations.marginAmount, 'INR')})`);
    handleTabChange('client-quotes');
    setTimeout(() => setSuccessBanner(null), 6000);
  };

  return (
    <div className="space-y-5 w-full">
      {/* Broker Profile Header Card */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-2xl p-5 sm:p-6 lg:p-7 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl text-slate-950 shadow-md shadow-amber-500/25 flex items-center justify-center shrink-0">
              <Briefcase className="w-6 h-6 fill-current text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase bg-amber-400/10 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                  LICENSED FREIGHT BROKERAGE
                </span>
                <span className="text-xs text-slate-400">ID: BRK-8942-IN</span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight mt-1">
                Apex Freight Brokerage Console
              </h1>
              <p className="text-xs text-slate-300 font-medium">
                Manage carrier contracts, set dynamic commission margins, and issue official client quotes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleTabChange('margin-calculator')}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Create Broker Quote</span>
            </button>
          </div>
        </div>

        {/* Top 4 Broker KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5 pt-5 border-t border-slate-800/70">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">NET COMMISSION EARNED</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-emerald-400 mt-1">
              {formatCurrency(totalBrokerageCommission, 'INR')}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Average 12.8% markup spread</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">MANAGED FREIGHT VOLUME</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-white mt-1">
              {formatCurrency(totalManagedVolume, 'INR')}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Across Ocean & Air loads</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">ACTIVE SHIPPER ACCOUNTS</span>
              <Building className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-amber-400 mt-1">
              24 Enterprise Clients
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">100% On-Time Bookings</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">CARRIER ALLIANCE CONTRACTS</span>
              <Ship className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-blue-400 mt-1">
              6 Top Carriers
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Direct Tier-1 wholesale rates</p>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="bg-emerald-600 text-white p-3.5 sm:p-4 rounded-xl shadow-lg flex items-center justify-between border border-emerald-500 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-emerald-700/80 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div className="text-xs sm:text-sm font-bold text-white">{successBanner}</div>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-xs bg-emerald-800 hover:bg-emerald-900 px-2.5 py-1 rounded-lg text-white font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Broker 2-Column Layout with Left Sidebar Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side Broker Navigation Bar */}
        <div className="lg:col-span-3 lg:sticky lg:top-20 z-10">
          <BrokerSidebarNav
            activeTab={activeTab}
            onSelectTab={handleTabChange}
            quotationsCount={quotations.length}
          />
        </div>

        {/* Right Side Main Content Panel */}
        <div className="lg:col-span-9 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Quick Actions and Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {/* Action Card 1: Custom Quote Builder */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between space-y-3.5">
              <div>
                <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl w-fit mb-2.5">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Broker Margin Studio</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Take wholesale carrier buy rates and adjust custom profit margins (2% - 30%) for corporate shippers.
                </p>
              </div>
              <button
                onClick={() => handleTabChange('margin-calculator')}
                className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-extrabold py-2.5 px-3.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Open Margin Studio</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>

            {/* Action Card 2: Carrier Spot Rates */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between space-y-3.5">
              <div>
                <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl w-fit mb-2.5">
                  <Ship className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Carrier Spot Bids</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Direct contract rates from Maersk, MSC, Hapag-Lloyd, CMA CGM, and Emirates SkyCargo.
                </p>
              </div>
              <button
                onClick={() => handleTabChange('carrier-rates')}
                className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-extrabold py-2.5 px-3.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Compare Carrier Rates</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </div>

            {/* Action Card 3: Commission Settlement */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between space-y-3.5">
              <div>
                <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl w-fit mb-2.5">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Commission Ledger</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Track settled commissions, pending releases, and shipment margin performance.
                </p>
              </div>
              <button
                onClick={() => handleTabChange('commission-ledger')}
                className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-extrabold py-2.5 px-3.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>View Commission History</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          </div>

          {/* Recent Broker Client Quotations */}
          <div className="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-sm sm:text-base">Recent Broker Quotations</h3>
                <p className="text-xs text-slate-500">Issued commercial quotes with applied broker spreads</p>
              </div>
              <button
                onClick={() => handleTabChange('client-quotes')}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View All Client Quotes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {INITIAL_COMMISSION_LEDGER.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-blue-600">{item.shipmentRef}</span>
                      <span className="text-xs font-bold text-slate-900">{item.clientName}</span>
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.2 rounded-full">
                        {item.carrier}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{item.route}</p>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <div className="text-right">
                      <div className="text-xs font-black text-slate-900">
                        Sell: {formatCurrency(item.sellPriceInr, 'INR')}
                      </div>
                      <div className="text-[11px] font-extrabold text-emerald-600">
                        Profit: +{formatCurrency(item.commissionEarnedInr, 'INR')} ({item.marginPct}%)
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                        item.status === 'SETTLED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'PENDING_PAYOUT'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MARGIN CALCULATOR & BROKER QUOTE CREATOR */}
      {activeTab === 'margin-calculator' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 lg:p-7 shadow-sm border border-slate-200/80 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Broker Margin Studio & Quotation Engine
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Configure carrier wholesale cost, add custom broker profit markup, and dispatch instant client quotes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold">
                Carrier: {carrierSelected}
              </span>
            </div>
          </div>

          <form onSubmit={handleIssueBrokerQuote} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Input Parameters (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* 1. Client Details */}
              <div className="bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-200/70 space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>1. Shipper Client Account</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Company Name</label>
                    <input
                      type="text"
                      value={clientCompanyName}
                      onChange={(e) => setClientCompanyName(e.target.value)}
                      required
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={clientContactPerson}
                      onChange={(e) => setClientContactPerson(e.target.value)}
                      required
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Client Email</label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      required
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Route & Carrier Parameters */}
              <div className="bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-200/70 space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Ship className="w-4 h-4 text-blue-600" />
                  <span>2. Trade Corridor & Carrier Selection</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Origin Port</label>
                    <select
                      value={originPort}
                      onChange={(e) => setOriginPort(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                    >
                      {PORTS_AND_HUBS.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.city} - {p.name} ({p.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Destination Port</label>
                    <select
                      value={destinationPort}
                      onChange={(e) => setDestinationPort(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                    >
                      {PORTS_AND_HUBS.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.city} - {p.name} ({p.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Carrier Partner</label>
                    <select
                      value={carrierSelected}
                      onChange={(e) => setCarrierSelected(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                    >
                      <option value="Maersk Line">Maersk Line (Ocean Tier-1)</option>
                      <option value="MSC Mediterranean">MSC Mediterranean Shipping</option>
                      <option value="CMA CGM">CMA CGM Line</option>
                      <option value="Hapag-Lloyd">Hapag-Lloyd</option>
                      <option value="Emirates SkyCargo">Emirates SkyCargo (Air)</option>
                      <option value="Qatar Airways Cargo">Qatar Airways Cargo (Air)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Equipment / Spec</label>
                    <select
                      value={containerSpec}
                      onChange={(e) => setContainerSpec(e.target.value as any)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                    >
                      <option value="20GP">20ft General Purpose (20GP)</option>
                      <option value="40HC">40ft High Cube (40HC)</option>
                      <option value="LCL_SLOT">LCL Cargo Slot (CBM Basis)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Margin & Fee Adjustments */}
              <div className="bg-amber-50/60 p-4 sm:p-5 rounded-xl border border-amber-200/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-2">
                    <Percent className="w-4 h-4 text-amber-600" />
                    <span>3. Dynamic Broker Commission & Spread Slider</span>
                  </h4>
                  <span className="bg-amber-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full shadow-sm">
                    {brokerMarginPct}% Margin
                  </span>
                </div>

                <div>
                  <input
                    type="range"
                    min={2}
                    max={30}
                    step={1}
                    value={brokerMarginPct}
                    onChange={(e) => setBrokerMarginPct(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer h-2 bg-amber-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-extrabold text-amber-800 mt-1">
                    <span>2% (Low Wholesale)</span>
                    <span>12% (Standard Commercial)</span>
                    <span>20% (Premium Urgent)</span>
                    <span>30% (Max Margin)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 uppercase mb-1">Carrier Buy Rate (INR)</label>
                    <input
                      type="number"
                      value={carrierBuyBase}
                      onChange={(e) => setCarrierBuyBase(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border border-amber-300 rounded-lg text-xs text-slate-900 font-black focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 uppercase mb-1">Customs Clearance & Brokerage Fee</label>
                    <input
                      type="number"
                      value={customsHandlingFee}
                      onChange={(e) => setCustomsHandlingFee(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border border-amber-300 rounded-lg text-xs text-slate-900 font-black focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Live Price Breakdown & Dispatch Button (5 cols) */}
            <div className="lg:col-span-5 bg-[#0F172A] text-white p-5 sm:p-6 rounded-2xl shadow-xl border border-slate-800 space-y-4 sticky top-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  <span>COMMERCIAL REVENUE BREAKDOWN</span>
                </span>
                <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                  INR CURRENCY
                </span>
              </div>

              {/* Cost vs Spread Breakdown Items */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Carrier Base Rate ({containerCount}x {containerSpec})</span>
                  <span className="font-semibold text-white">{formatCurrency(brokerCalculations.buySubtotal, 'INR')}</span>
                </div>

                <div className="flex justify-between text-slate-300">
                  <span>Bunker Adjustment Factor (BAF)</span>
                  <span className="font-semibold text-white">{formatCurrency(brokerCalculations.bafFuel, 'INR')}</span>
                </div>

                <div className="flex justify-between text-slate-300">
                  <span>Terminal Handling Charges (THC)</span>
                  <span className="font-semibold text-white">{formatCurrency(brokerCalculations.terminalHandling, 'INR')}</span>
                </div>

                <div className="flex justify-between text-slate-400 pt-1.5 border-t border-slate-800 font-bold">
                  <span>Total Carrier Buy Cost</span>
                  <span className="text-slate-200">{formatCurrency(brokerCalculations.totalCarrierCost, 'INR')}</span>
                </div>

                {/* HIGHLIGHTED BROKER PROFIT */}
                <div className="flex justify-between bg-amber-500/20 border border-amber-500/40 p-2.5 rounded-xl text-amber-300 font-black">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <span>Broker Spread Margin ({brokerMarginPct}%)</span>
                  </span>
                  <span className="text-sm">+{formatCurrency(brokerCalculations.marginAmount, 'INR')}</span>
                </div>

                <div className="flex justify-between text-slate-300">
                  <span>Customs Clearance & Brokerage</span>
                  <span className="font-semibold text-white">{formatCurrency(brokerCalculations.customsHandlingFee, 'INR')}</span>
                </div>

                <div className="flex justify-between text-slate-300">
                  <span>Applicable GST (5%)</span>
                  <span className="font-semibold text-white">{formatCurrency(brokerCalculations.gstTax, 'INR')}</span>
                </div>
              </div>

              {/* Grand Total Client Price */}
              <div className="pt-3 border-t border-slate-800">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  FINAL CLIENT INVOICE AMOUNT
                </div>
                <div className="text-2xl font-black text-emerald-400 mt-0.5">
                  {formatCurrency(brokerCalculations.finalClientPrice, 'INR')}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Includes linehaul, clearance, documentation & GST
                </p>
              </div>

              {/* Submit / Issue Quote Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>ISSUE BROKER QUOTATION TO CLIENT</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: CLIENT QUOTATIONS & BROKER MARKUPS */}
      {activeTab === 'client-quotes' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 lg:p-7 shadow-sm border border-slate-200/80 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Managed Client Freight Quotations
                </h2>
                {(quotations || []).filter((q) => q.status === 'PENDING_BROKER_REVIEW').length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 animate-pulse">
                    {(quotations || []).filter((q) => q.status === 'PENDING_BROKER_REVIEW').length} Pending Action
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Review client requests, manually adjust linehaul rates and profit margins, and dispatch finalized quotes
              </p>
            </div>
            <button
              onClick={() => handleTabChange('margin-calculator')}
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-amber-600/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Quote</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={quoteSearchTerm}
                onChange={(e) => setQuoteSearchTerm(e.target.value)}
                placeholder="Search by quote ID, shipper company, route or port..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => setQuoteFilterStatus('ALL')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  quoteFilterStatus === 'ALL'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({(quotations || []).length})
              </button>
              <button
                type="button"
                onClick={() => setQuoteFilterStatus('PENDING')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  quoteFilterStatus === 'PENDING'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Pending Review</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-200/80 text-[10px]">
                  {(quotations || []).filter((q) => q.status === 'PENDING_BROKER_REVIEW').length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setQuoteFilterStatus('FINALIZED')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  quoteFilterStatus === 'FINALIZED'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dispatched ({(quotations || []).filter((q) => q.status === 'BROKER_FINALIZED' || q.status === 'ISSUED').length})
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="w-full bg-slate-900 text-white rounded-xl overflow-hidden shadow-md border border-slate-800">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-950/90">
                    <th className="py-3 px-3.5 whitespace-nowrap">QUOTE ID</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">SHIPPER CLIENT</th>
                    <th className="py-3 px-3.5">TRADE CORRIDOR</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">MODE</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">CLIENT INVOICED (INR)</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">STATUS & ASSIGNMENT</th>
                    <th className="py-3 px-3.5 text-right whitespace-nowrap">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs">
                  {filteredQuotations.map((quote) => {
                      const isPendingReview = quote.status === 'PENDING_BROKER_REVIEW';
                      const isFinalized = quote.status === 'BROKER_FINALIZED';

                      return (
                        <tr
                          key={quote.id}
                          className={`hover:bg-slate-800/60 transition-colors ${
                            isPendingReview ? 'bg-amber-950/20' : ''
                          }`}
                        >
                          <td className="py-3 px-3.5 font-black text-amber-400 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>{quote.id}</span>
                              {quote.isBrokerEdited && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                                  CUSTOMIZED
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 font-bold text-white whitespace-nowrap">
                            <div>{quote.companyName || quote.shipperName}</div>
                            {quote.assignedCarrier && (
                              <div className="text-[10px] text-slate-400 font-medium">Carrier: {quote.assignedCarrier}</div>
                            )}
                          </td>
                          <td className="py-3 px-3.5 font-medium text-slate-200">
                            <div className="whitespace-nowrap">{quote.routeSummary}</div>
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap">
                              {quote.transportMode === 'ocean' ? <Ship className="w-3.5 h-3.5 text-cyan-400" /> : <Plane className="w-3.5 h-3.5 text-amber-400" />}
                              <span>{quote.transportMode.toUpperCase()}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3.5 font-black text-emerald-400 whitespace-nowrap text-sm">
                            <div>{formatCurrency(quote.tariffAmount, quote.currency)}</div>
                            {quote.brokerProfitInr ? (
                              <div className="text-[10px] text-amber-400 font-bold">
                                +{formatCurrency(quote.brokerProfitInr, 'INR')} broker margin
                              </div>
                            ) : null}
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            {isPendingReview ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                                <span>PENDING BROKER REVIEW</span>
                              </span>
                            ) : isFinalized ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>DISPATCHED TO CLIENT</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                {quote.status}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-right whitespace-nowrap space-x-1.5">
                            {/* Review & Edit Action Button */}
                            <button
                              onClick={() => setReviewModalQuote(quote)}
                              className={`px-2.5 py-1.2 rounded-lg text-xs font-black inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                                isPendingReview
                                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-sm'
                                  : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30'
                              }`}
                              title="Manually adjust rates, carrier and margins before sending to customer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{isPendingReview ? 'Review & Dispatch' : 'Adjust'}</span>
                            </button>

                            <button
                              onClick={() => onViewQuotePDF(quote)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1.2 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors border border-slate-700 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Preview</span>
                            </button>
                            <button
                              onClick={() => generateQuotePDF(quote)}
                              className="bg-amber-600 hover:bg-amber-500 text-slate-950 px-2.5 py-1.2 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* BROKER QUOTE REVIEW & ADJUSTMENT MODAL */}
      {reviewModalQuote && (
        <BrokerQuoteReviewModal
          quote={reviewModalQuote}
          isOpen={Boolean(reviewModalQuote)}
          onClose={() => setReviewModalQuote(null)}
          onSaveQuote={(updatedQuote) => {
            if (onUpdateQuotation) {
              onUpdateQuotation(updatedQuote);
            }
            setReviewModalQuote(null);
            setSuccessBanner(
              `Quotation ${updatedQuote.id} adjusted and dispatched to ${
                updatedQuote.companyName || updatedQuote.shipperName
              }! Final client price: ${formatCurrency(updatedQuote.tariffAmount, updatedQuote.currency)}`
            );
            setTimeout(() => setSuccessBanner(null), 6000);
          }}
        />
      )}

      {/* TAB 4: CARRIER SPOT RATES MATRIX */}
      {activeTab === 'carrier-rates' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 lg:p-7 shadow-sm border border-slate-200/80 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Live Carrier Spot Rate Matrix
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Wholesale carrier buy rates from major shipping lines and cargo air freighters
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {INITIAL_SPOT_RATES.map((spot) => (
              <div
                key={spot.id}
                className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 border border-slate-800 space-y-3.5 shadow-md flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                      {spot.carrierName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      Valid: {spot.validUntil}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-black text-white">
                      {spot.originPort} → {spot.destinationPort}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                      {spot.mode === 'ocean' ? <Ship className="w-3.5 h-3.5 text-cyan-400" /> : <Plane className="w-3.5 h-3.5 text-amber-400" />}
                      <span>{spot.equipment}</span>
                    </div>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-lg space-y-1 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Carrier Buy Rate:</span>
                      <span className="font-black text-white">{formatCurrency(spot.buyRateInr, 'INR')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Suggested Sell:</span>
                      <span className="font-bold text-emerald-400">{formatCurrency(spot.suggestedSellInr, 'INR')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[10px] pt-1 border-t border-slate-700/60">
                      <span>Transit: {spot.transitDays} Days</span>
                      <span>Reliability: {spot.reliabilityScore}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectCarrierSpot(spot)}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-2 px-3.5 rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Select & Apply Margin</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: COMMISSION SETTLEMENT LEDGER */}
      {activeTab === 'commission-ledger' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 lg:p-7 shadow-sm border border-slate-200/80 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Broker Commission Settlement Ledger
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Verified broker margins, settlement dates, and payment disbursement records
              </p>
            </div>
            <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-black">
              Total Commission: {formatCurrency(totalBrokerageCommission, 'INR')}
            </div>
          </div>

          <div className="w-full bg-slate-900 text-white rounded-xl overflow-hidden shadow-md border border-slate-800">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-950/90">
                    <th className="py-3 px-3.5 whitespace-nowrap">SHIPMENT REF</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">CLIENT ACCOUNT</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">BUY COST</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">SELL INVOICE</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">SPREAD PROFIT</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">SETTLEMENT STATUS</th>
                    <th className="py-3 px-3.5 whitespace-nowrap text-right">DATE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs">
                  {INITIAL_COMMISSION_LEDGER.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-3.5 font-black text-blue-400 whitespace-nowrap">{item.shipmentRef}</td>
                      <td className="py-3 px-3.5 font-bold text-white whitespace-nowrap">{item.clientName}</td>
                      <td className="py-3 px-3.5 font-semibold text-slate-300 whitespace-nowrap">
                        {formatCurrency(item.buyCostInr, 'INR')}
                      </td>
                      <td className="py-3 px-3.5 font-black text-white whitespace-nowrap">
                        {formatCurrency(item.sellPriceInr, 'INR')}
                      </td>
                      <td className="py-3 px-3.5 font-black text-emerald-400 whitespace-nowrap">
                        +{formatCurrency(item.commissionEarnedInr, 'INR')} ({item.marginPct}%)
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${
                            item.status === 'SETTLED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : item.status === 'PENDING_PAYOUT'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right text-slate-400 font-mono whitespace-nowrap">
                        {item.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* TAB: MILESTONE 1 ROUTE OPERATIONS */}
      {activeTab === 'm1-routes' && (
        <Milestone1RouteOperationsView onSendToPricing={() => handleTabChange('m2-quotes')} />
      )}

      {/* TAB: MILESTONE 2 BROKER QUOTATIONS */}
      {activeTab === 'm2-quotes' && (
        <Milestone2BrokerQuotationView />
      )}

      {/* TAB: LIVE FLEET TRACKING & GOOGLE MAP AIS RADAR */}
      {activeTab === 'tracking' && (
        <div className="space-y-6 animate-in fade-in">
          <TrackingView
            userRole="broker"
            onViewQuotationPdf={(quoteId) => {
              const matched = quotations.find((q) => q.id === quoteId);
              if (matched) onViewQuotePDF(matched);
            }}
          />
        </div>
      )}
        </div>
      </div>
    </div>
  );
};
