import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Ship,
  Plane,
  Truck,
  Zap,
  Tag,
  Calendar,
  MapPin,
  Package,
  AlertCircle,
  ArrowRight,
  BookmarkPlus,
  FolderOpen,
  CheckCircle2,
  X,
  Clock
} from 'lucide-react';
import { QuoteFormState, TransportMode, OceanLoadType, Incoterm, PackageType, ContainerSpec, CurrencyCode, QuoteDraft } from '../types';
import { PORTS_AND_HUBS, PICKUP_POINTS, DELIVERY_POINTS, PROMO_COUPONS } from '../data/freightData';
import { useMasterData } from '../services/masterDataService';

interface CalculationFormProps {
  formData: QuoteFormState;
  onChangeForm: (updates: Partial<QuoteFormState>) => void;
  onAddCargoItem: () => void;
  onRemoveCargoItem: (id: string) => void;
  onUpdateCargoItem: (id: string, updates: any) => void;
  onGenerateQuotation?: () => void;
  onResetForm?: () => void;
  isGenerating?: boolean;
}

const DRAFTS_STORAGE_KEY = 'freighthub_saved_drafts_v1';

export const CalculationForm: React.FC<CalculationFormProps> = ({
  formData,
  onChangeForm,
  onAddCargoItem,
  onRemoveCargoItem,
  onUpdateCargoItem,
  onGenerateQuotation,
  onResetForm,
  isGenerating = false,
}) => {
  const [drafts, setDrafts] = useState<QuoteDraft[]>([]);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState<boolean>(false);
  const [isDraftSavedModalOpen, setIsDraftSavedModalOpen] = useState<boolean>(false);
  const [justSavedDraft, setJustSavedDraft] = useState<QuoteDraft | null>(null);
  const [draftToast, setDraftToast] = useState<string | null>(null);

  // Live Master Data
  const { ports: masterPorts, incoterms: masterIncoterms, packagingTypes: masterPackagingTypes } = useMasterData();

  // Combine static and live master ports seamlessly
  const combinedPorts = React.useMemo(() => {
    const list = [...PORTS_AND_HUBS];
    masterPorts.forEach((mp) => {
      if (mp.isActive !== false) {
        const code = mp.unlocode || mp.code || mp._id;
        if (code && !list.some((p) => p.code === code || p.name.includes(mp.portName))) {
          list.push({
            code,
            name: `${code} — ${mp.portName}, ${mp.city || mp.countryCode || ''}`,
            city: mp.city || mp.portName,
            country: mp.countryCode || 'Global',
            type: 'sea',
            locationLabel: `${mp.portName} Hub`,
          });
        }
      }
    });
    return list;
  }, [masterPorts]);

  // Load saved drafts on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DRAFTS_STORAGE_KEY);
      if (stored) {
        setDrafts(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load drafts:', err);
    }
  }, []);

  // Save current form inputs as draft
  const handleSaveDraft = () => {
    const origin = formData.originPortCode || 'BOM';
    const dest = formData.destinationPortCode || 'AEJEA';
    const originHub = PORTS_AND_HUBS.find((p) => p.code === origin);
    const destHub = PORTS_AND_HUBS.find((p) => p.code === dest);

    const draftTitle = `${originHub?.city || origin} → ${destHub?.city || dest} (${formData.transportMode.toUpperCase()})`;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString()} at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const totalWeight = formData.cargoItems.reduce((sum, item) => sum + (item.grossWeightKg || 0) * (item.quantity || 1), 0);

    const newDraft: QuoteDraft = {
      id: `draft-${Date.now()}`,
      title: draftTitle,
      savedAt: formattedDate,
      formData: { ...formData },
      routeSummary: `${origin} -> ${dest}`,
      transportMode: formData.transportMode,
      totalWeightKg: totalWeight,
      estimatedTariffInr: 0,
    };

    const updatedDrafts = [newDraft, ...drafts.filter((d) => d.id !== newDraft.id)];
    setDrafts(updatedDrafts);
    setJustSavedDraft(newDraft);
    setIsDraftSavedModalOpen(true);

    try {
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(updatedDrafts));
    } catch (err) {
      console.error('Failed to persist draft:', err);
    }

    setDraftToast(`Quotation inputs saved as draft "${draftTitle}"!`);
    setTimeout(() => setDraftToast(null), 4500);
  };

  const handleLoadDraft = (draft: QuoteDraft) => {
    onChangeForm({ ...draft.formData });
    setIsDraftsModalOpen(false);
    setDraftToast(`Draft "${draft.title}" loaded successfully into calculator.`);
    setTimeout(() => setDraftToast(null), 4000);
  };

  const handleDeleteDraft = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = drafts.filter((d) => d.id !== id);
    setDrafts(updated);
    try {
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to update drafts:', err);
    }
  };

  // Helper to get today's date in YYYY-MM-DD local format
  const getTodayDateString = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDateStr = getTodayDateString();

  // Helper to calculate min delivery date (cargoReadyDate + 2 days, from today onwards)
  const getMinDeliveryDate = (readyDateStr: string): string => {
    const baseDateStr = readyDateStr && readyDateStr >= todayDateStr ? readyDateStr : todayDateStr;
    const date = new Date(baseDateStr);
    if (isNaN(date.getTime())) return todayDateStr;
    date.setDate(date.getDate() + 2); // At least 2 days gap
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const minDeliveryDate = getMinDeliveryDate(formData.cargoReadyDate);

  const handleCargoReadyDateChange = (newDateStr: string) => {
    // If user somehow selects or enters a past date, clamp it to today
    let sanitizedReadyDate = newDateStr;
    if (sanitizedReadyDate && sanitizedReadyDate < todayDateStr) {
      sanitizedReadyDate = todayDateStr;
    }

    const newMinDelivery = getMinDeliveryDate(sanitizedReadyDate);
    let updatedDelivery = formData.requiredDeliveryDate;

    if (updatedDelivery && newMinDelivery && updatedDelivery < newMinDelivery) {
      updatedDelivery = newMinDelivery;
    }

    onChangeForm({
      cargoReadyDate: sanitizedReadyDate,
      requiredDeliveryDate: updatedDelivery,
    });
  };

  const handleRequiredDeliveryDateChange = (selectedDateStr: string) => {
    const effectiveMin = minDeliveryDate || todayDateStr;
    if (effectiveMin && selectedDateStr && selectedDateStr < effectiveMin) {
      onChangeForm({ requiredDeliveryDate: effectiveMin });
    } else {
      onChangeForm({ requiredDeliveryDate: selectedDateStr });
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Draft Notification Toast */}
      {draftToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between border border-emerald-500 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span className="text-xs font-bold">{draftToast}</span>
          </div>
          <button
            onClick={() => setDraftToast(null)}
            className="p-1 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-700/50 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* STEP 1: ROUTE DETAILS */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-600/30">
              1
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Route Details</h3>
              <p className="text-xs text-slate-500 font-medium">Origin, destination, and dispatch dates</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Saved Drafts Button */}
            <button
              type="button"
              onClick={() => setIsDraftsModalOpen(true)}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition-all border border-amber-200 flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="View and restore saved quotation drafts"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>Saved Drafts ({drafts.length})</span>
            </button>

            {/* Quick Save Draft Button */}
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl text-xs font-bold transition-all border border-blue-200 flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Save current form inputs as draft"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-blue-600" />
              <span>Save as Draft</span>
            </button>

            {onResetForm && (
              <button
                type="button"
                onClick={onResetForm}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                title="Reset all form inputs"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Origin Port */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>ORIGIN PORT / HUB *</span>
            </label>
            <select
              value={formData.originPortCode}
              onChange={(e) => onChangeForm({ originPortCode: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option value="">-- Select Origin Port / Hub ({combinedPorts.length} available) --</option>
              {combinedPorts.map((port) => (
                <option key={port.code} value={port.code}>
                  {port.name}
                </option>
              ))}
            </select>
          </div>

          {/* Destination Port */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>DESTINATION PORT / HUB *</span>
            </label>
            <select
              value={formData.destinationPortCode}
              onChange={(e) => onChangeForm({ destinationPortCode: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option value="">-- Select Destination Port / Hub ({combinedPorts.length} available) --</option>
              {combinedPorts.map((port) => (
                <option key={port.code} value={port.code}>
                  {port.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pickup Hub */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>PICKUP HUB / ADDRESS (DOOR PICKUP)</span>
            </label>
            <select
              value={formData.pickupHubId}
              onChange={(e) => onChangeForm({ pickupHubId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option value="">-- Select Pickup Point (Optional) --</option>
              {PICKUP_POINTS.map((pickup) => (
                <option key={pickup.id} value={pickup.id}>
                  {pickup.name}
                </option>
              ))}
            </select>
          </div>

          {/* Delivery Hub */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>DELIVERY HUB / ADDRESS (DOOR DELIVERY)</span>
            </label>
            <select
              value={formData.deliveryHubId}
              onChange={(e) => onChangeForm({ deliveryHubId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option value="">-- Select Delivery Point (Optional) --</option>
              {DELIVERY_POINTS.map((delivery) => (
                <option key={delivery.id} value={delivery.id}>
                  {delivery.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cargo Ready Date */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>CARGO READY DATE *</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 normal-case">Days before today disabled</span>
            </label>
            <input
              type="date"
              min={todayDateStr}
              value={formData.cargoReadyDate}
              onChange={(e) => handleCargoReadyDateChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
            />
            <p className="text-[10px] font-semibold text-slate-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-500 shrink-0" />
              <span>Earliest selectable: Today ({todayDateStr})</span>
            </p>
          </div>

          {/* Required Delivery Date */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>REQUIRED DELIVERY DATE (MIN 2-DAY GAP)</span>
            </label>
            <input
              type="date"
              min={minDeliveryDate || todayDateStr}
              value={formData.requiredDeliveryDate}
              onChange={(e) => handleRequiredDeliveryDateChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
            />
            {minDeliveryDate && (
              <p className="text-[10px] font-semibold text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Must be at least 2 days after cargo ready date (Earliest: {minDeliveryDate})</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* STEP 2: SERVICE & COMMERCIAL TERMS */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-600/30">
            2
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Service & Commercial Terms</h3>
            <p className="text-xs text-slate-500 font-medium">Transport mode and commercial terms</p>
          </div>
        </div>

        {/* Transport Mode Buttons */}
        <div>
          <label className="block text-[11px] font-extrabold text-slate-700 mb-2 uppercase tracking-wider">
            TRANSPORT MODE *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'ocean', label: 'Ocean Freight', icon: Ship },
              { id: 'air', label: 'Air Freight', icon: Plane },
              { id: 'ground', label: 'Ground & Rail', icon: Truck },
              { id: 'express', label: 'Express Air', icon: Zap },
            ].map((mode) => {
              const Icon = mode.icon;
              const isActive = formData.transportMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onChangeForm({ transportMode: mode.id as TransportMode })}
                  className={`py-3 px-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ocean Parameters Block */}
        {formData.transportMode === 'ocean' && (
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-4">
            <div className="text-[10px] font-black text-blue-900 uppercase tracking-widest">
              OCEAN PARAMETERS
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
                  LOAD TYPE *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onChangeForm({ oceanLoadType: 'FCL' })}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all border ${
                      formData.oceanLoadType === 'FCL'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    FCL (Full Container)
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeForm({ oceanLoadType: 'LCL' })}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all border ${
                      formData.oceanLoadType === 'LCL'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    LCL (Shared)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
                  INCOTERM *
                </label>
                <select
                  value={formData.incoterm}
                  onChange={(e) => onChangeForm({ incoterm: e.target.value as Incoterm })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                >
                  <option value="FOB">FOB — Free On Board</option>
                  <option value="CIF">CIF — Cost Insurance Freight</option>
                  <option value="EXW">EXW — Ex Works</option>
                  <option value="DDP">DDP — Delivered Duty Paid</option>
                  <option value="CFR">CFR — Cost and Freight</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STEP 3: CARGO & CARGO LINE ITEMS */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-600/30">
            3
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Cargo & Cargo Line Items</h3>
            <p className="text-xs text-slate-500 font-medium">Package dimensions, weights, and descriptions</p>
          </div>
        </div>

        {/* Line Items Array */}
        <div className="space-y-4">
          {formData.cargoItems.map((item, index) => (
            <div
              key={item.id}
              className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 space-y-4 relative"
            >
              <div className="flex items-center justify-between">
                <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  ITEM #{index + 1 < 10 ? `0${index + 1}` : index + 1}
                </span>

                {formData.cargoItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveCargoItem(item.id)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
                    PACKAGE TYPE *
                  </label>
                  <select
                    value={item.packageType}
                    onChange={(e) => onUpdateCargoItem(item.id, { packageType: e.target.value as PackageType })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="Pallet">Pallet</option>
                    <option value="Wooden Crate">Wooden Crate</option>
                    <option value="Carton">Carton</option>
                    <option value="20GP Container">20GP Container</option>
                    <option value="40HC Container">40HC Container</option>
                    <option value="Drums">Drums</option>
                    <option value="Bales">Bales</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
                    CONTAINER SPEC *
                  </label>
                  <select
                    value={item.containerSpec}
                    onChange={(e) => onUpdateCargoItem(item.id, { containerSpec: e.target.value as ContainerSpec })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="20GP">20GP — General Purpose</option>
                    <option value="40HC">40HC — High Cube</option>
                    <option value="40GP">40GP — General Purpose</option>
                    <option value="LCL_SLOT">LCL Shared Slot</option>
                    <option value="EURO_PALLET">Euro Pallet (120x80cm)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
                    QUANTITY / COUNT *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => onUpdateCargoItem(item.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
                    GROSS WEIGHT (KG) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={item.grossWeightKg}
                    onChange={(e) => onUpdateCargoItem(item.id, { grossWeightKg: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
                    COMMODITY DESCRIPTION *
                  </label>
                  <input
                    type="text"
                    placeholder="Cotton textile rolls, unbleached"
                    value={item.commodityDescription}
                    onChange={(e) => onUpdateCargoItem(item.id, { commodityDescription: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
                    HS CODE
                  </label>
                  <input
                    type="text"
                    placeholder="5208.11"
                    value={item.hsCode}
                    onChange={(e) => onUpdateCargoItem(item.id, { hsCode: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onAddCargoItem}
          className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Cargo Line Item</span>
        </button>
      </div>

      {/* STEP 4: ADDITIONAL DETAILS */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-600/30">
            4
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Additional Details</h3>
            <p className="text-xs text-slate-500 font-medium">Value, handling and special requirements</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
              DECLARED VALUE
            </label>
            <input
              type="number"
              value={formData.declaredValue}
              onChange={(e) => onChangeForm({ declaredValue: Math.max(0, parseFloat(e.target.value) || 0) })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
              CURRENCY *
            </label>
            <select
              value={formData.currency}
              onChange={(e) => onChangeForm({ currency: e.target.value as CurrencyCode })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option value="INR">INR — Indian Rupee</option>
              <option value="USD">USD — US Dollar</option>
              <option value="AED">AED — UAE Dirham</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
            SPECIAL INSTRUCTIONS (OPTIONAL)
          </label>
          <textarea
            rows={2}
            placeholder="e.g. call before delivery"
            value={formData.specialInstructions}
            onChange={(e) => onChangeForm({ specialInstructions: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none resize-none"
          />
        </div>

        {/* Checkboxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {[
            { id: 'fragileGoods', label: 'Fragile goods' },
            { id: 'hazardousMaterials', label: 'Hazardous materials' },
            { id: 'temperatureControlled', label: 'Temperature controlled' },
            { id: 'addCargoInsurance', label: 'Add cargo insurance' },
          ].map((item) => {
            const key = item.id as keyof QuoteFormState;
            const checked = Boolean(formData[key]);
            return (
              <label
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors bg-slate-50/50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onChangeForm({ [key]: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-800">{item.label}</span>
              </label>
            );
          })}
        </div>

        {/* Applied Coupon Selector */}
        <div className="pt-2">
          <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-amber-500" />
            <span>APPLY DISCOUNT COUPON</span>
          </label>
          <select
            value={formData.promoCodeApplied || ''}
            onChange={(e) => onChangeForm({ promoCodeApplied: e.target.value || null })}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
          >
            <option value="">No Coupon Applied</option>
            {PROMO_COUPONS.map((coupon) => (
              <option key={coupon.code} value={coupon.code}>
                {coupon.code} — {coupon.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* STEP 5: CONTACT DETAILS */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-600/30">
            5
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Contact Details</h3>
            <p className="text-xs text-slate-500 font-medium">Who receives the quotation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
              FULL NAME *
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => onChangeForm({ fullName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
              COMPANY *
            </label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => onChangeForm({ companyName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
              EMAIL *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => onChangeForm({ email: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
              COUNTRY *
            </label>
            <select
              value={formData.country}
              onChange={(e) => onChangeForm({ country: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option value="">-- Select Country --</option>
              <option value="India">India</option>
              <option value="United Arab Emirates">United Arab Emirates</option>
              <option value="Netherlands">Netherlands</option>
              <option value="United States">United States</option>
              <option value="Singapore">Singapore</option>
              <option value="United Kingdom">United Kingdom</option>
            </select>
          </div>
        </div>

        {/* Primary Action Button & Save as Draft */}
        <div className="pt-6 mt-6 border-t border-slate-200/80 flex flex-col sm:flex-row justify-center items-center gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="w-full sm:w-auto px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-slate-300 shadow-sm hover:shadow active:scale-95 cursor-pointer"
          >
            <BookmarkPlus className="w-4 h-4 text-blue-600" />
            <span>SAVE INPUTS AS DRAFT</span>
          </button>

          {onGenerateQuotation && (
            <button
              type="button"
              onClick={onGenerateQuotation}
              disabled={isGenerating}
              className="w-full sm:w-auto min-w-[300px] relative group overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-500 active:from-blue-700 active:to-indigo-700 text-white font-black py-4 px-8 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all duration-200 shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-500/50 ring-2 ring-blue-500/40 hover:ring-blue-300 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="animate-pulse">CALCULATING OFFICIAL QUOTE...</span>
                </>
              ) : (
                <span className="flex items-center gap-2 relative z-10">
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0 group-hover:scale-110 transition-transform" />
                  <span>GENERATE OFFICIAL FREIGHT QUOTATION</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* SAVED DRAFTS MODAL */}
      {isDraftsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-5 px-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 text-slate-950 rounded-xl">
                  <FolderOpen className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Saved Quotation Drafts</h3>
                  <p className="text-xs text-slate-400">Restore or manage saved cargo & route inputs</p>
                </div>
              </div>
              <button
                onClick={() => setIsDraftsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {drafts.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <BookmarkPlus className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-slate-800 text-sm">No Saved Drafts Yet</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Fill out your route, mode, and cargo items, then click "Save Inputs as Draft" to store your template for quick future calculation.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">{draft.title}</span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {draft.transportMode}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {draft.savedAt}
                          </span>
                          <span>•</span>
                          <span>{draft.formData.cargoItems.length} cargo item(s)</span>
                          {draft.formData.incoterm && (
                            <>
                              <span>•</span>
                              <span>Incoterm: {draft.formData.incoterm}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteDraft(draft.id, e)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete draft"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadDraft(draft)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Load Draft</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {drafts.length} template draft(s) stored locally
              </span>
              <button
                type="button"
                onClick={() => setIsDraftsModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAFT IS SAVED SUCCESSFULLY POP-UP MODAL */}
      {isDraftSavedModalOpen && justSavedDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header Banner */}
            <div className="p-5 sm:p-6 bg-gradient-to-br from-emerald-600 to-teal-700 text-white text-center relative">
              <button
                type="button"
                onClick={() => setIsDraftSavedModalOpen(false)}
                className="absolute top-3.5 right-3.5 p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-black/10">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>

              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 text-white px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                SAVED TO LOCAL WORKSPACE
              </span>
              <h3 className="text-xl font-black text-white">Draft is Saved Successfully!</h3>
              <p className="text-xs text-emerald-100 font-medium mt-1">
                Your quotation inputs and cargo parameters have been stored safely.
              </p>
            </div>

            {/* Saved Details Content */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 sm:p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Route Summary</span>
                  <span className="font-extrabold text-slate-900">{justSavedDraft.title}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Mode & Items</span>
                  <span className="font-bold text-slate-800">
                    {justSavedDraft.transportMode.toUpperCase()} • {justSavedDraft.formData.cargoItems.length} Cargo Item(s)
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Saved Timestamp</span>
                  <span className="text-slate-700 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {justSavedDraft.savedAt}
                  </span>
                </div>

                {justSavedDraft.formData.incoterm && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">Commercial Term</span>
                    <span className="font-extrabold text-blue-600">{justSavedDraft.formData.incoterm}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-500 text-center leading-relaxed">
                You can reload these inputs anytime using the <span className="font-bold text-slate-700">"Saved Drafts"</span> button in the calculator or continue editing.
              </p>

              {/* Modal Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsDraftSavedModalOpen(false)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/25 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>CONTINUE EDITING</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDraftSavedModalOpen(false);
                    setIsDraftsModalOpen(true);
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4 text-slate-600" />
                  <span>VIEW ALL DRAFTS ({drafts.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
