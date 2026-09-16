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
  Clock,
  Lock,
  ShieldAlert,
  Sparkles,
  FileText,
  Upload,
  Eye,
} from 'lucide-react';
import { QuoteFormState, TransportMode, OceanLoadType, Incoterm, PackageType, ContainerSpec, CurrencyCode, QuoteDraft, TradeDocument } from '../types';
import { PORTS_AND_HUBS, PICKUP_POINTS, DELIVERY_POINTS, PROMO_COUPONS } from '../data/freightData';
import { useMasterData } from '../services/masterDataService';
import { DocumentViewerModal } from './DocumentViewerModal';

interface CalculationFormProps {
  formData: QuoteFormState;
  onChangeForm: (updates: Partial<QuoteFormState>) => void;
  onAddCargoItem: () => void;
  onRemoveCargoItem: (id: string) => void;
  onUpdateCargoItem: (id: string, updates: any) => void;
  onGenerateQuotation?: (docs?: TradeDocument[]) => void;
  onResetForm?: () => void;
  isGenerating?: boolean;
}

interface FormValidationErrors {
  originPortCode?: string;
  destinationPortCode?: string;
  cargoReadyDate?: string;
  transportMode?: string;
  incoterm?: string;
  cargoItems?: string;
  fullName?: string;
  companyName?: string;
  email?: string;
  country?: string;
  tradeDocuments?: string;
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

  // 4 Required Regulatory Documents State (Clearance Gate - Real Device Uploads Only)
  const [deviceDocuments, setDeviceDocuments] = useState<{
    invoice: TradeDocument | null;
    packingList: TradeDocument | null;
    bol: TradeDocument | null;
    coo: TradeDocument | null;
  }>({
    invoice: null,
    packingList: null,
    bol: null,
    coo: null,
  });

  const [viewingDoc, setViewingDoc] = useState<TradeDocument | null>(null);

  const handleDeviceFileUpload = (
    key: 'invoice' | 'packingList' | 'bol' | 'coo',
    file: File | undefined,
    title: string,
    docType: 'invoice' | 'packing_list' | 'bol' | 'coo'
  ) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const sizeStr = file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      const newDoc: TradeDocument = {
        id: `DOC-${Date.now()}-${key}`,
        name: file.name,
        title,
        file: file.name,
        fileSize: sizeStr,
        size: sizeStr,
        type: docType,
        dataUrl,
        uploadedAt: new Date().toISOString(),
        status: 'uploaded',
        companyStatus: 'awaiting_review',
        customsStatus: 'awaiting_review',
      };

      setDeviceDocuments((prev) => ({ ...prev, [key]: newDoc }));
      setTouchedFields((prev) => ({ ...prev, tradeDocuments: true }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDeviceFile = (key: 'invoice' | 'packingList' | 'bol' | 'coo') => {
    setDeviceDocuments((prev) => ({ ...prev, [key]: null }));
  };

  // Validation State Tracking
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);

  // Live Master Data
  const { ports: masterPorts, incoterms: masterIncoterms, packagingTypes: masterPackagingTypes } = useMasterData();

  // Combine static and live master ports seamlessly
  const combinedPorts = React.useMemo(() => {
    const list = [...PORTS_AND_HUBS];
    masterPorts.forEach((mp) => {
      if (mp.isActive !== false) {
        const code = mp.unlocode || mp._id;
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
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setDrafts(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load drafts:', err);
    }
  }, []);

  const markTouched = (fieldName: string) => {
    setTouchedFields((prev) => ({ ...prev, [fieldName]: true }));
  };

  // Comprehensive Required Field Validation Engine
  const getValidationErrors = (): FormValidationErrors => {
    const errors: FormValidationErrors = {};

    if (!formData.originPortCode) {
      errors.originPortCode = 'Origin Port / Hub is required.';
    }

    if (!formData.destinationPortCode) {
      errors.destinationPortCode = 'Destination Port / Hub is required.';
    } else if (formData.originPortCode && formData.originPortCode === formData.destinationPortCode) {
      errors.destinationPortCode = 'Origin and Destination ports cannot be identical.';
    } else if (formData.originPortCode && formData.destinationPortCode) {
      const originPort = combinedPorts.find((p) => p.code === formData.originPortCode);
      const destPort = combinedPorts.find((p) => p.code === formData.destinationPortCode);
      if (originPort && destPort && originPort.type !== destPort.type) {
        const originTypeStr = originPort.type === 'air' ? 'an Airport' : originPort.type === 'sea' ? 'a Seaport' : 'a Ground Hub';
        const destTypeStr = originPort.type === 'air' ? 'an Airport' : originPort.type === 'sea' ? 'a Seaport' : 'a Ground Hub';
        errors.destinationPortCode = `Transport Mode Mismatch: Origin is ${originTypeStr}, so Destination must also be ${destTypeStr}. Cross-modal origin-destination routing requires matching hub types.`;
      }
    }

    if (!formData.cargoReadyDate) {
      errors.cargoReadyDate = 'Cargo Ready Date is required.';
    }

    if (!formData.transportMode) {
      errors.transportMode = 'Transport mode selection is required.';
    }

    if (!formData.incoterm) {
      errors.incoterm = 'Incoterm commercial trade term is required.';
    }

    const items = formData.cargoItems || [];
    if (items.length === 0) {
      errors.cargoItems = 'At least 1 cargo item is required.';
    } else {
      const invalidItem = items.find(
        (item) => !item || !item.quantity || Number(item.quantity) <= 0 || !item.grossWeightKg || Number(item.grossWeightKg) <= 0
      );
      if (invalidItem) {
        errors.cargoItems = 'All cargo items must have quantity > 0 and gross weight > 0 kg.';
      }
    }

    if (!formData.fullName || !formData.fullName.trim()) {
      errors.fullName = 'Shipper Full Name is required.';
    }

    if (!formData.companyName || !formData.companyName.trim()) {
      errors.companyName = 'Company Name is required.';
    }

    if (!formData.email || !formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address format.';
    }

    if (!formData.country) {
      errors.country = 'Country is required.';
    }

    // 4 Mandatory Regulatory Trade Documents Check (Customer must upload all 4 from device before generating quote)
    if (!deviceDocuments.invoice || !deviceDocuments.packingList || !deviceDocuments.bol || !deviceDocuments.coo) {
      const missing: string[] = [];
      if (!deviceDocuments.invoice) missing.push('Commercial Invoice');
      if (!deviceDocuments.packingList) missing.push('Packing List');
      if (!deviceDocuments.bol) missing.push(formData.transportMode === 'air' || formData.transportMode === 'express' ? 'Air Waybill (AWB) Draft' : 'Bill of Lading Draft');
      if (!deviceDocuments.coo) missing.push('Certificate of Origin');
      errors.tradeDocuments = `Regulatory Document Gate: Missing ${missing.join(', ')}. All 4 trade documents must be selected from your device.`;
    }

    return errors;
  };

  const validationErrors = getValidationErrors();
  const errorKeys = Object.keys(validationErrors) as (keyof FormValidationErrors)[];
  const isFormValid = errorKeys.length === 0;

  const isFieldInvalid = (fieldName: keyof FormValidationErrors): boolean => {
    return Boolean((touchedFields[fieldName] || formSubmitted) && validationErrors[fieldName]);
  };

  const validateAndSubmitQuotation = () => {
    setFormSubmitted(true);
    const errors = getValidationErrors();
    if (Object.keys(errors).length > 0) {
      return false;
    }
    if (onGenerateQuotation) {
      const docsList = Object.values(deviceDocuments).filter(Boolean) as TradeDocument[];
      onGenerateQuotation(docsList);
    }
    return true;
  };

  // Save current form inputs as draft
  const handleSaveDraft = () => {
    const origin = formData.originPortCode || 'BOM';
    const dest = formData.destinationPortCode || 'AEJEA';
    const originHub = PORTS_AND_HUBS.find((p) => p.code === origin);
    const destHub = PORTS_AND_HUBS.find((p) => p.code === dest);

    const draftTitle = `${originHub?.city || origin} → ${destHub?.city || dest} (${formData.transportMode.toUpperCase()})`;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString()} at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const totalWeight = (formData.cargoItems || []).reduce((sum, item) => sum + (item.grossWeightKg || 0) * (item.quantity || 1), 0);

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

    const updatedDrafts = [newDraft, ...(drafts || []).filter((d) => d && d.id !== newDraft.id)];
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
    const updated = (drafts || []).filter((d) => d && d.id !== id);
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

  const getMinDeliveryDate = (readyDateStr: string): string => {
    const baseDateStr = readyDateStr && readyDateStr >= todayDateStr ? readyDateStr : todayDateStr;
    const date = new Date(baseDateStr);
    if (isNaN(date.getTime())) return todayDateStr;
    date.setDate(date.getDate() + 2);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const minDeliveryDate = getMinDeliveryDate(formData.cargoReadyDate);

  const handleCargoReadyDateChange = (newDateStr: string) => {
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
    markTouched('cargoReadyDate');
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
    <div className="space-y-6 relative font-sans">
      {/* Top Required Field Error Alert Banner */}
      {formSubmitted && !isFormValid && (
        <div className="p-4 bg-red-500/10 border-2 border-red-500/60 rounded-3xl space-y-2 text-red-300 text-xs shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 font-black text-red-400">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span className="text-sm">Freight Quotation Blocked — Mandatory Fields Required</span>
            </div>
            <span className="px-2.5 py-1 bg-red-500/20 text-red-300 rounded-full text-[10px] font-mono font-bold border border-red-500/40">
              {errorKeys.length} Field(s) Invalid
            </span>
          </div>
          <p className="text-[11px] text-slate-300 pl-7">
            You cannot calculate or generate an official freight quote without completing all required parameters highlighted below:
          </p>
          <ul className="pl-7 list-disc space-y-1 text-[11px] font-mono text-red-200">
            {Object.entries(validationErrors).map(([key, msg]) => (
              <li key={key}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

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
            <button
              type="button"
              onClick={() => setIsDraftsModalOpen(true)}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition-all border border-amber-200 flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="View and restore saved quotation drafts"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>Saved Drafts ({drafts.length})</span>
            </button>

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
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>ORIGIN PORT / HUB <span className="text-red-500 font-bold">*</span></span>
              </span>
              {!formData.originPortCode ? (
                <span className="text-[9px] text-amber-600 font-mono font-bold">Required</span>
              ) : (
                <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {combinedPorts.find(p => p.code === formData.originPortCode)?.type === 'air' ? '✈️ AIRPORT' : combinedPorts.find(p => p.code === formData.originPortCode)?.type === 'sea' ? '⚓ SEAPORT' : '🚛 GROUND HUB'}
                </span>
              )}
            </label>
            <select
              value={formData.originPortCode}
              onBlur={() => markTouched('originPortCode')}
              onChange={(e) => {
                const code = e.target.value;
                const matched = combinedPorts.find((p) => p.code === code);
                const updates: Partial<QuoteFormState> = { originPortCode: code };
                if (matched) {
                  if (matched.type === 'air') updates.transportMode = 'air';
                  else if (matched.type === 'sea') updates.transportMode = 'ocean';
                  else if (matched.type === 'ground') updates.transportMode = 'ground';

                  // Filter valid destinations by origin type and adjust destination if needed
                  const currentDest = combinedPorts.find((p) => p.code === formData.destinationPortCode);
                  if (!currentDest || currentDest.type !== matched.type || currentDest.code === matched.code) {
                    const firstValidDest = combinedPorts.find((p) => p.type === matched.type && p.code !== matched.code);
                    updates.destinationPortCode = firstValidDest ? firstValidDest.code : '';
                  }
                }
                onChangeForm(updates);
                markTouched('originPortCode');
              }}
              className={`w-full border rounded-2xl px-3.5 py-3 text-xs font-semibold focus:outline-none transition-all ${
                isFieldInvalid('originPortCode')
                  ? 'bg-red-50 border-red-500 text-red-900 focus:border-red-600'
                  : formData.originPortCode
                  ? 'bg-emerald-50/50 border-emerald-500/60 text-slate-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-600'
              }`}
            >
              <option value="">-- Select Origin Port / Hub ({combinedPorts.length} available) --</option>
              {combinedPorts.map((port) => {
                const typeLabel = port.type === 'air' ? '✈️ [AIRPORT]' : port.type === 'sea' ? '⚓ [SEAPORT]' : '🚛 [GROUND]';
                return (
                  <option key={port.code} value={port.code}>
                    {typeLabel} {port.name}
                  </option>
                );
              })}
            </select>
            {isFieldInvalid('originPortCode') && (
              <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-500 shrink-0" /> {validationErrors.originPortCode}
              </p>
            )}
          </div>

          {/* Destination Port */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>DESTINATION PORT / HUB <span className="text-red-500 font-bold">*</span></span>
              </span>
              {!formData.destinationPortCode ? (
                <span className="text-[9px] text-amber-600 font-mono font-bold">Required</span>
              ) : (
                <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {combinedPorts.find(p => p.code === formData.destinationPortCode)?.type === 'air' ? '✈️ AIRPORT' : combinedPorts.find(p => p.code === formData.destinationPortCode)?.type === 'sea' ? '⚓ SEAPORT' : '🚛 GROUND HUB'}
                </span>
              )}
            </label>
            {(() => {
              const originPort = combinedPorts.find(p => p.code === formData.originPortCode);
              const validDestinations = combinedPorts.filter(port => {
                if (port.code === formData.originPortCode) return false;
                if (!originPort) return true;
                return port.type === originPort.type;
              });

              return (
                <select
                  value={formData.destinationPortCode}
                  onBlur={() => markTouched('destinationPortCode')}
                  onChange={(e) => {
                    onChangeForm({ destinationPortCode: e.target.value });
                    markTouched('destinationPortCode');
                  }}
                  className={`w-full border rounded-2xl px-3.5 py-3 text-xs font-semibold focus:outline-none transition-all ${
                    isFieldInvalid('destinationPortCode')
                      ? 'bg-red-50 border-red-500 text-red-900 focus:border-red-600'
                      : formData.destinationPortCode && formData.destinationPortCode !== formData.originPortCode
                      ? 'bg-emerald-50/50 border-emerald-500/60 text-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-600'
                  }`}
                >
                  <option value="">
                    {originPort
                      ? `-- Select ${originPort.type === 'air' ? 'Destination Airport' : originPort.type === 'sea' ? 'Destination Seaport' : 'Destination Ground Hub'} (${validDestinations.length} available) --`
                      : `-- Select Destination Port / Hub (${combinedPorts.length} available) --`}
                  </option>
                  {validDestinations.map((port) => {
                    const typeLabel = port.type === 'air' ? '✈️ [AIRPORT]' : port.type === 'sea' ? '⚓ [SEAPORT]' : '🚛 [GROUND]';
                    return (
                      <option key={port.code} value={port.code}>
                        {typeLabel} {port.name}
                      </option>
                    );
                  })}
                </select>
              );
            })()}
            {isFieldInvalid('destinationPortCode') && (
              <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-500 shrink-0" /> {validationErrors.destinationPortCode}
              </p>
            )}
          </div>

          {/* Manual Pickup Address Entry */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>PICKUP ADDRESS (MANUAL ENTRY / DOOR PICKUP)</span>
              </span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Manual Input</span>
            </label>
            <input
              type="text"
              value={formData.pickupAddress || ''}
              onChange={(e) => onChangeForm({ pickupAddress: e.target.value })}
              placeholder="Enter exact pickup location (e.g. Warehouse 14, MIDC Phase II, Andheri East, Mumbai 400093)"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-inner"
            />
            <div className="flex items-center gap-2 pt-0.5 text-[11px] text-slate-500">
              <span className="shrink-0 text-[10px] font-semibold text-slate-400">Or quick-fill frequent depot:</span>
              <select
                value=""
                onChange={(e) => {
                  const pickup = PICKUP_POINTS.find((p) => p.id === e.target.value);
                  if (pickup) {
                    onChangeForm({ pickupAddress: `${pickup.name}, ${pickup.address}`, pickupHubId: pickup.id });
                  }
                }}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg px-2 py-1 border border-slate-200 cursor-pointer focus:outline-none"
              >
                <option value="">-- Choose Depot to Autofill --</option>
                {PICKUP_POINTS.map((pickup) => (
                  <option key={pickup.id} value={pickup.id}>
                    {pickup.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Manual Delivery Address Entry */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>DELIVERY ADDRESS (MANUAL ENTRY / DOOR DELIVERY)</span>
              </span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Manual Input</span>
            </label>
            <input
              type="text"
              value={formData.deliveryAddress || ''}
              onChange={(e) => onChangeForm({ deliveryAddress: e.target.value })}
              placeholder="Enter exact delivery destination (e.g. Haven 1024, Maasvlakte Industrial Zone, Rotterdam, 3199 LK Netherlands)"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-inner"
            />
            <div className="flex items-center gap-2 pt-0.5 text-[11px] text-slate-500">
              <span className="shrink-0 text-[10px] font-semibold text-slate-400">Or quick-fill frequent hub:</span>
              <select
                value=""
                onChange={(e) => {
                  const delivery = DELIVERY_POINTS.find((d) => d.id === e.target.value);
                  if (delivery) {
                    onChangeForm({ deliveryAddress: `${delivery.name}, ${delivery.address}`, deliveryHubId: delivery.id });
                  }
                }}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg px-2 py-1 border border-slate-200 cursor-pointer focus:outline-none"
              >
                <option value="">-- Choose Hub to Autofill --</option>
                {DELIVERY_POINTS.map((delivery) => (
                  <option key={delivery.id} value={delivery.id}>
                    {delivery.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cargo Ready Date */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>CARGO READY DATE <span className="text-red-500 font-bold">*</span></span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 normal-case">Days before today disabled</span>
            </label>
            <input
              type="date"
              min={todayDateStr}
              value={formData.cargoReadyDate}
              onBlur={() => markTouched('cargoReadyDate')}
              onChange={(e) => handleCargoReadyDateChange(e.target.value)}
              className={`w-full border rounded-2xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all ${
                isFieldInvalid('cargoReadyDate')
                  ? 'bg-red-50 border-red-500 text-red-900 focus:border-red-600'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-600'
              }`}
            />
            {isFieldInvalid('cargoReadyDate') && (
              <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-500 shrink-0" /> {validationErrors.cargoReadyDate}
              </p>
            )}
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

        {/* Transport Mode Buttons - Dynamically Filtered by Route Type */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
              TRANSPORT MODE <span className="text-red-500 font-bold">*</span>
            </label>
            {(() => {
              const origin = combinedPorts.find((p) => p.code === formData.originPortCode);
              if (origin?.type === 'air') {
                return (
                  <span className="text-[10px] font-extrabold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    ✈️ Airport Route — Flight Cargo Only
                  </span>
                );
              }
              if (origin?.type === 'sea') {
                return (
                  <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    ⚓ Seaport Route — Ocean Cargo Only
                  </span>
                );
              }
              if (origin?.type === 'ground') {
                return (
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    🚛 Ground Route — Road & Rail Cargo Only
                  </span>
                );
              }
              return null;
            })()}
          </div>

          {(() => {
            const origin = combinedPorts.find((p) => p.code === formData.originPortCode);
            const allModes = [
              { id: 'ocean', label: 'Ocean Cargo (FCL/LCL)', icon: Ship, routeType: 'sea' },
              { id: 'air', label: 'Flight Cargo (Air Freight)', icon: Plane, routeType: 'air' },
              { id: 'express', label: 'Flight Cargo (Express)', icon: Zap, routeType: 'air' },
              { id: 'ground', label: 'Ground Cargo (Road/Rail)', icon: Truck, routeType: 'ground' },
            ];

            const availableModes = allModes.filter((mode) => {
              if (!origin) return true;
              return mode.routeType === origin.type;
            });

            return (
              <div className={`grid gap-2.5 ${availableModes.length === 1 ? 'grid-cols-1 max-w-sm' : availableModes.length === 2 ? 'grid-cols-2 max-w-md' : 'grid-cols-2 sm:grid-cols-4'}`}>
                {availableModes.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = formData.transportMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        onChangeForm({ transportMode: mode.id as TransportMode });
                        markTouched('transportMode');
                      }}
                      className={`py-3.5 px-4 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2.5 transition-all border cursor-pointer ${
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
            );
          })()}
          {isFieldInvalid('transportMode') && (
            <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-red-500 shrink-0" /> {validationErrors.transportMode}
            </p>
          )}
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
                  LOAD TYPE <span className="text-red-500 font-bold">*</span>
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
                  INCOTERM <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  value={formData.incoterm}
                  onBlur={() => markTouched('incoterm')}
                  onChange={(e) => {
                    onChangeForm({ incoterm: e.target.value as Incoterm });
                    markTouched('incoterm');
                  }}
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none transition-all ${
                    isFieldInvalid('incoterm')
                      ? 'bg-red-50 border-red-500 text-red-900 focus:border-red-600'
                      : 'bg-white border-slate-200 text-slate-800 focus:border-blue-600'
                  }`}
                >
                  <option value="FOB">FOB — Free On Board</option>
                  <option value="CIF">CIF — Cost Insurance Freight</option>
                  <option value="EXW">EXW — Ex Works</option>
                  <option value="DDP">DDP — Delivered Duty Paid</option>
                  <option value="CFR">CFR — Cost and Freight</option>
                  <option value="FCA">FCA — Free Carrier</option>
                  <option value="DAP">DAP — Delivered At Place</option>
                </select>
                {isFieldInvalid('incoterm') && (
                  <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-500 shrink-0" /> {validationErrors.incoterm}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STEP 3: CARGO & CARGO LINE ITEMS */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-600/30">
              3
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Cargo & Cargo Line Items</h3>
              <p className="text-xs text-slate-500 font-medium">Package dimensions, weights, and descriptions</p>
            </div>
          </div>
          {isFieldInvalid('cargoItems') && (
            <span className="text-[11px] font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full flex items-center gap-1 border border-red-200">
              <AlertCircle className="w-3.5 h-3.5 text-red-500" /> Invalid Cargo Line Items
            </span>
          )}
        </div>

        {/* Line Items Array */}
        <div className="space-y-4">
          {(formData?.cargoItems || []).map((item, index) => (
            <div
              key={item.id}
              className={`border rounded-2xl p-5 space-y-4 relative transition-all ${
                (!item.quantity || item.quantity <= 0 || !item.grossWeightKg || item.grossWeightKg <= 0) && (formSubmitted || touchedFields[`item_${item.id}`])
                  ? 'bg-red-50/50 border-red-300'
                  : 'bg-slate-50/80 border-slate-200'
              }`}
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
                    PACKAGE TYPE <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={item.packageType}
                    onChange={(e) => onUpdateCargoItem(item.id, { packageType: e.target.value as PackageType })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                  >
                    {formData.transportMode === 'air' || formData.transportMode === 'express' ? (
                      <>
                        <option value="Carton">Air Cargo Carton</option>
                        <option value="Pallet">Aviation Cargo Pallet (PMC/PAG)</option>
                        <option value="Wooden Crate">Aviation Spec Wooden Crate</option>
                        <option value="Drums">Certified Air Drums / Pails</option>
                        <option value="Bales">Compressed Air Bales</option>
                      </>
                    ) : formData.transportMode === 'ground' ? (
                      <>
                        <option value="Pallet">Standard Warehouse Pallet</option>
                        <option value="Wooden Crate">Heavy Duty Wooden Crate</option>
                        <option value="Carton">Corrugated Shipping Carton</option>
                        <option value="Drums">Industrial Drums (Chemical/Lube)</option>
                        <option value="Bales">Agricultural / Textile Bales</option>
                      </>
                    ) : (
                      <>
                        <option value="Pallet">Palletized Ocean Goods</option>
                        <option value="Wooden Crate">Seaworthy Wooden Crate</option>
                        <option value="Carton">Master Export Carton</option>
                        <option value="20GP Container">20GP Standard Container</option>
                        <option value="40HC Container">40HC High Cube Container</option>
                        <option value="Drums">Export Drums</option>
                        <option value="Bales">Baled Cargo</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
                    {formData.transportMode === 'air' || formData.transportMode === 'express'
                      ? 'ULD / AIR CONTAINER SPEC'
                      : formData.transportMode === 'ground'
                      ? 'TRUCK / WAGON SPEC'
                      : 'OCEAN CONTAINER SPEC'}{' '}
                    <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={item.containerSpec}
                    onChange={(e) => onUpdateCargoItem(item.id, { containerSpec: e.target.value as ContainerSpec })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                  >
                    {formData.transportMode === 'air' || formData.transportMode === 'express' ? (
                      <>
                        <option value="LCL_SLOT">Loose Aviation Cargo (Lower Deck)</option>
                        <option value="EURO_PALLET">PMC Main Deck Air Pallet (125x96)</option>
                        <option value="20GP">LD3 / AKE Aviation ULD Container</option>
                        <option value="40GP">LD7 / PAG Aviation Pallet</option>
                        <option value="40HC">Temperature Controlled Envirotainer</option>
                      </>
                    ) : formData.transportMode === 'ground' ? (
                      <>
                        <option value="LCL_SLOT">LTL (Less than Truckload) Slot</option>
                        <option value="20GP">20ft Multi-Axle Truck (FTL)</option>
                        <option value="40GP">32ft High-Cube Multi-Axle Truck (FTL)</option>
                        <option value="40HC">40ft Rail Wagon Flat Container</option>
                        <option value="EURO_PALLET">Intermodal Euro Pallet Slot</option>
                      </>
                    ) : (
                      <>
                        <option value="20GP">20GP — General Purpose 20ft</option>
                        <option value="40HC">40HC — High Cube 40ft (Extra Height)</option>
                        <option value="40GP">40GP — General Purpose 40ft</option>
                        <option value="LCL_SLOT">LCL — Less Than Container Load (Consolidation)</option>
                        <option value="EURO_PALLET">Euro Pallet Space (120x80cm)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center justify-between">
                    <span>QUANTITY / COUNT <span className="text-red-500 font-bold">*</span></span>
                    {(!item.quantity || item.quantity <= 0) && <span className="text-[9px] text-red-600 font-mono">Min 1</span>}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity || ''}
                    onBlur={() => markTouched(`item_${item.id}`)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      onUpdateCargoItem(item.id, { quantity: isNaN(val) ? 0 : val });
                      markTouched(`item_${item.id}`);
                    }}
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all ${
                      (!item.quantity || item.quantity <= 0) && (formSubmitted || touchedFields[`item_${item.id}`])
                        ? 'bg-red-50 border-red-500 text-red-900 focus:border-red-600'
                        : 'bg-white border-slate-200 text-slate-800 focus:border-blue-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center justify-between">
                    <span>GROSS WEIGHT (KG) <span className="text-red-500 font-bold">*</span></span>
                    {(!item.grossWeightKg || item.grossWeightKg <= 0) && <span className="text-[9px] text-red-600 font-mono">Min 1 KG</span>}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={item.grossWeightKg || ''}
                    onBlur={() => markTouched(`item_${item.id}`)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onUpdateCargoItem(item.id, { grossWeightKg: isNaN(val) ? 0 : val });
                      markTouched(`item_${item.id}`);
                    }}
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all ${
                      (!item.grossWeightKg || item.grossWeightKg <= 0) && (formSubmitted || touchedFields[`item_${item.id}`])
                        ? 'bg-red-50 border-red-500 text-red-900 focus:border-red-600'
                        : 'bg-white border-slate-200 text-slate-800 focus:border-blue-600'
                    }`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
                    COMMODITY DESCRIPTION
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cotton Textiles, Electronic Machinery Parts..."
                    value={item.commodityDescription}
                    onChange={(e) => onUpdateCargoItem(item.id, { commodityDescription: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={onAddCargoItem}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-colors border border-slate-200/80 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>ADD ANOTHER CARGO ITEM</span>
          </button>
        </div>
      </div>

      {/* STEP 4: SHIPPER & CONTACT DETAILS */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-600/30">
            4
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Contact Details</h3>
            <p className="text-xs text-slate-500 font-medium">Who receives the quotation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center justify-between">
              <span>FULL NAME <span className="text-red-500 font-bold">*</span></span>
              {!formData.fullName && <span className="text-[9px] text-amber-600 font-mono font-bold">Required</span>}
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onBlur={() => markTouched('fullName')}
              onChange={(e) => {
                onChangeForm({ fullName: e.target.value });
                markTouched('fullName');
              }}
              placeholder="e.g. Aparajita Sharma"
              className={`w-full border rounded-2xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all ${
                isFieldInvalid('fullName')
                  ? 'bg-red-50 border-red-500 text-red-900 focus:border-red-600'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-600'
              }`}
            />
            {isFieldInvalid('fullName') && (
              <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-500 shrink-0" /> {validationErrors.fullName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center justify-between">
              <span>COMPANY <span className="text-red-500 font-bold">*</span></span>
              {!formData.companyName && <span className="text-[9px] text-amber-600 font-mono font-bold">Required</span>}
            </label>
            <input
              type="text"
              required
              value={formData.companyName}
              onBlur={() => markTouched('companyName')}
              onChange={(e) => {
                onChangeForm({ companyName: e.target.value });
                markTouched('companyName');
              }}
              placeholder="e.g. Sharma Logistics Pvt Ltd"
              className={`w-full border rounded-2xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all ${
                isFieldInvalid('companyName')
                  ? 'bg-red-50 border-red-500 text-red-900 focus:border-red-600'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-600'
              }`}
            />
            {isFieldInvalid('companyName') && (
              <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-500 shrink-0" /> {validationErrors.companyName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center justify-between">
              <span>EMAIL <span className="text-red-500 font-bold">*</span></span>
              {!formData.email && <span className="text-[9px] text-amber-600 font-mono font-bold">Required</span>}
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onBlur={() => markTouched('email')}
              onChange={(e) => {
                onChangeForm({ email: e.target.value });
                markTouched('email');
              }}
              placeholder="e.g. aparajita@sharmalogistics.com"
              className={`w-full border rounded-2xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all ${
                isFieldInvalid('email')
                  ? 'bg-red-50 border-red-500 text-red-900 focus:border-red-600'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-600'
              }`}
            />
            {isFieldInvalid('email') && (
              <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-500 shrink-0" /> {validationErrors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center justify-between">
              <span>COUNTRY <span className="text-red-500 font-bold">*</span></span>
              {!formData.country && <span className="text-[9px] text-amber-600 font-mono font-bold">Required</span>}
            </label>
            <select
              value={formData.country}
              onBlur={() => markTouched('country')}
              onChange={(e) => {
                onChangeForm({ country: e.target.value });
                markTouched('country');
              }}
              className={`w-full border rounded-2xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all ${
                isFieldInvalid('country')
                  ? 'bg-red-50 border-red-500 text-red-900 focus:border-red-600'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-600'
              }`}
            >
              <option value="">-- Select Country --</option>
              <option value="India">India</option>
              <option value="United Arab Emirates">United Arab Emirates</option>
              <option value="Netherlands">Netherlands</option>
              <option value="United States">United States</option>
              <option value="Singapore">Singapore</option>
              <option value="United Kingdom">United Kingdom</option>
            </select>
            {isFieldInvalid('country') && (
              <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-500 shrink-0" /> {validationErrors.country}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* STEP 5: REGULATORY COMPLIANCE & TRADE DOCUMENTS (Clearance Gate - Device Upload Only) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-600/30">
              5
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Mandatory Regulatory Trade Documents</h3>
              <p className="text-xs text-slate-500 font-medium">
                All 4 trade documents must be selected from your local device before generating carrier quotations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {Object.values(deviceDocuments).filter(Boolean).length} of 4 Attached
            </span>
          </div>
        </div>

        {validationErrors.tradeDocuments && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{validationErrors.tradeDocuments}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Doc 1: Commercial Invoice */}
          <div className={`p-4 rounded-2xl border transition-all ${
            deviceDocuments.invoice
              ? 'bg-emerald-50/40 border-emerald-300'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className={`w-5 h-5 ${deviceDocuments.invoice ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-black text-slate-900">Commercial Invoice</div>
                  <div className="text-[10px] text-slate-500 font-medium">Valuation & HS Code Proof</div>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-md text-[9px] font-black uppercase tracking-wider border border-red-200">
                Mandatory
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200/60">
              {deviceDocuments.invoice ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-slate-800 truncate block font-mono">
                        {deviceDocuments.invoice.name}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {deviceDocuments.invoice.size} • Uploaded from device
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => setViewingDoc(deviceDocuments.invoice)}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3 text-blue-600" />
                      <span>Inspect</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveDeviceFile('invoice')}
                      className="text-[10px] text-slate-500 hover:text-red-600 font-bold px-1 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="w-full py-2.5 px-3 bg-white hover:bg-blue-50/50 border border-dashed border-slate-300 hover:border-blue-400 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Select Commercial Invoice from Device</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => handleDeviceFileUpload('invoice', e.target.files?.[0], 'Commercial Invoice', 'invoice')}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Doc 2: Packing List */}
          <div className={`p-4 rounded-2xl border transition-all ${
            deviceDocuments.packingList
              ? 'bg-emerald-50/40 border-emerald-300'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className={`w-5 h-5 ${deviceDocuments.packingList ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-black text-slate-900">Packing List</div>
                  <div className="text-[10px] text-slate-500 font-medium">Weight, CBM & Pieces Breakdown</div>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-md text-[9px] font-black uppercase tracking-wider border border-red-200">
                Mandatory
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200/60">
              {deviceDocuments.packingList ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-slate-800 truncate block font-mono">
                        {deviceDocuments.packingList.name}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {deviceDocuments.packingList.size} • Uploaded from device
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => setViewingDoc(deviceDocuments.packingList)}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3 text-blue-600" />
                      <span>Inspect</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveDeviceFile('packingList')}
                      className="text-[10px] text-slate-500 hover:text-red-600 font-bold px-1 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="w-full py-2.5 px-3 bg-white hover:bg-blue-50/50 border border-dashed border-slate-300 hover:border-blue-400 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Select Packing List from Device</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => handleDeviceFileUpload('packingList', e.target.files?.[0], 'Packing List', 'packing_list')}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Doc 3: Bill of Lading / Air Waybill Draft */}
          <div className={`p-4 rounded-2xl border transition-all ${
            deviceDocuments.bol
              ? 'bg-emerald-50/40 border-emerald-300'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className={`w-5 h-5 ${deviceDocuments.bol ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-black text-slate-900">
                    {formData.transportMode === 'air' || formData.transportMode === 'express'
                      ? 'Air Waybill Draft (AWB)'
                      : formData.transportMode === 'ground'
                      ? 'Lorry Receipt / Consignment Note'
                      : 'Bill of Lading Draft (B/L)'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Carrier Consignment Document</div>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-md text-[9px] font-black uppercase tracking-wider border border-red-200">
                Mandatory
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200/60">
              {deviceDocuments.bol ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-slate-800 truncate block font-mono">
                        {deviceDocuments.bol.name}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {deviceDocuments.bol.size} • Uploaded from device
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => setViewingDoc(deviceDocuments.bol)}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3 text-blue-600" />
                      <span>Inspect</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveDeviceFile('bol')}
                      className="text-[10px] text-slate-500 hover:text-red-600 font-bold px-1 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="w-full py-2.5 px-3 bg-white hover:bg-blue-50/50 border border-dashed border-slate-300 hover:border-blue-400 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    Select {formData.transportMode === 'air' || formData.transportMode === 'express' ? 'AWB Draft' : 'B/L Draft'} from Device
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) =>
                      handleDeviceFileUpload(
                        'bol',
                        e.target.files?.[0],
                        formData.transportMode === 'air' || formData.transportMode === 'express' ? 'Air Waybill Draft' : 'Bill of Lading Draft',
                        'bol'
                      )
                    }
                  />
                </label>
              )}
            </div>
          </div>

          {/* Doc 4: Certificate of Origin */}
          <div className={`p-4 rounded-2xl border transition-all ${
            deviceDocuments.coo
              ? 'bg-emerald-50/40 border-emerald-300'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className={`w-5 h-5 ${deviceDocuments.coo ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-black text-slate-900">Certificate of Origin (COO)</div>
                  <div className="text-[10px] text-slate-500 font-medium">Statutory Chamber Certification</div>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-md text-[9px] font-black uppercase tracking-wider border border-red-200">
                Mandatory
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200/60">
              {deviceDocuments.coo ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-slate-800 truncate block font-mono">
                        {deviceDocuments.coo.name}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {deviceDocuments.coo.size} • Uploaded from device
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => setViewingDoc(deviceDocuments.coo)}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3 text-blue-600" />
                      <span>Inspect</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveDeviceFile('coo')}
                      className="text-[10px] text-slate-500 hover:text-red-600 font-bold px-1 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="w-full py-2.5 px-3 bg-white hover:bg-blue-50/50 border border-dashed border-slate-300 hover:border-blue-400 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Select Certificate of Origin from Device</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => handleDeviceFileUpload('coo', e.target.files?.[0], 'Certificate of Origin', 'coo')}
                  />
                </label>
              )}
            </div>
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
              onClick={validateAndSubmitQuotation}
              disabled={isGenerating}
              className={`w-full sm:w-auto min-w-[300px] relative group overflow-hidden font-black py-4 px-8 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all duration-200 shadow-xl cursor-pointer active:scale-95 ${
                isFormValid
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-500 text-white shadow-blue-600/30 ring-2 ring-blue-500/40'
                  : 'bg-gradient-to-r from-red-950/40 via-red-900/40 to-red-950/40 text-red-300 border border-red-500/40 hover:bg-red-900/50'
              }`}
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="animate-pulse">CALCULATING OFFICIAL QUOTE...</span>
                </>
              ) : isFormValid ? (
                <span className="flex items-center gap-2 relative z-10">
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0 group-hover:scale-110 transition-transform" />
                  <span>COMPARE 3 CARRIER QUOTES & SELECT</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              ) : (
                <span className="flex items-center gap-2 relative z-10 text-red-300">
                  <Lock className="w-4 h-4 text-red-400 shrink-0" />
                  <span>COMPLETE REQUIRED FIELDS TO CALCULATE</span>
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
                  {(drafts || []).map((draft) => (
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

      {/* Document Inspection Modal */}
      {viewingDoc && (
        <DocumentViewerModal document={viewingDoc} onClose={() => setViewingDoc(null)} />
      )}
    </div>
  );
};
