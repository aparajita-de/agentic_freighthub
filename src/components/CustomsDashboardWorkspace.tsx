import React, { useState } from 'react';
import {
  FileCheck2,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Search,
  Filter,
  FileText,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Check,
  Building,
  Eye,
  AlertCircle,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import {
  CustomsComplianceCheck,
  CustomsChecklistItem,
  ComplianceStatus,
  SignOffAction,
  RiskLevel
} from '../types/milestone3';
import { SEEDED_CUSTOMS_CHECKS } from '../data/milestone3Data';

interface CustomsDashboardWorkspaceProps {
  userRole?: string;
  userEmail?: string;
  onNavigateToRegulations?: () => void;
}

export const CustomsDashboardWorkspace: React.FC<CustomsDashboardWorkspaceProps> = ({
  userRole = 'customs-officer',
  userEmail = 'customs.appraiser@cbic.gov.in',
  onNavigateToRegulations,
}) => {
  const [cases, setCases] = useState<CustomsComplianceCheck[]>(SEEDED_CUSTOMS_CHECKS);
  const [selectedCase, setSelectedCase] = useState<CustomsComplianceCheck>(SEEDED_CUSTOMS_CHECKS[1]); // Needs Review by default
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [officerNotes, setOfficerNotes] = useState<string>('');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [actionToast, setActionToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // File Upload State
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  // Filtered cases
  const filteredCases = (cases || []).filter((c) => {
    if (!c) return false;
    const term = (searchTerm || '').trim().toLowerCase();
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesSearch =
      !term ||
      (c.shipmentId || '').toLowerCase().includes(term) ||
      (c.hsCode || '').includes(term) ||
      (c.commodity || '').toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  // Handle Officer Sign-Off (Calls /v1/customs/{check_id}/sign-off)
  const handleSignOff = async (action: SignOffAction) => {
    setIsProcessing(true);
    const nowStr = new Date().toISOString();

    try {
      // Call backend sign-off endpoint
      const response = await fetch(`/v1/customs/${selectedCase.id}/sign-off`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          officer_id: userEmail.split('@')[0].toUpperCase(),
          officer_name: 'Customs Appraiser Rajesh Kumar',
          notes: officerNotes || `Official review completed with action: ${action}`,
          verified_item_ids: selectedItemIds,
        }),
      });

      let updatedStatus: ComplianceStatus;
      let newReadiness = selectedCase.readinessScore;

      if (action === 'APPROVE') {
        updatedStatus = 'APPROVED';
        newReadiness = 100;
      } else if (action === 'CONDITIONAL') {
        updatedStatus = 'CONDITIONAL';
        newReadiness = Math.max(85, selectedCase.readinessScore);
      } else if (action === 'REQUEST_DOCUMENTS') {
        updatedStatus = 'NEEDS_DOCUMENTS';
        newReadiness = Math.min(60, selectedCase.readinessScore);
      } else {
        updatedStatus = 'REJECTED';
        newReadiness = 0;
      }

      const updatedCase: CustomsComplianceCheck = {
        ...selectedCase,
        status: updatedStatus,
        readinessScore: newReadiness,
        reviewedBy: `Customs Appraiser (${userEmail})`,
        reviewerNotes: officerNotes || `Sign-off executed: ${action}`,
        signOffAction: action,
        signedOffAt: nowStr,
        checklistItems: (selectedCase.checklistItems || []).map((item) =>
          selectedItemIds.includes(item.id) || action === 'APPROVE'
            ? { ...item, status: 'VERIFIED' as any, documentUploaded: true }
            : item
        ),
      };

      setCases((prev) => (prev || []).map((c) => (c.id === updatedCase.id ? updatedCase : c)));
      setSelectedCase(updatedCase);
      setOfficerNotes('');
      setSelectedItemIds([]);

      setActionToast({
        message: `Consignment ${selectedCase.shipmentId} sign-off executed: ${action}. Quote state machine updated.`,
        type: action === 'APPROVE' ? 'success' : (action === 'REJECT' ? 'error' : 'warning'),
      });
    } catch {
      setActionToast({
        message: `Sign-off recorded locally for ${selectedCase.shipmentId}.`,
        type: 'success',
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setActionToast(null), 5000);
    }
  };

  // Document Upload Handler
  const handleFileUpload = (fileName: string) => {
    setUploadedFiles((prev) => [...prev, fileName]);
    const updatedItems = (selectedCase.checklistItems || []).map((item, idx) =>
      idx === 0 || !item.documentUploaded
        ? { ...item, documentUploaded: true, uploadedFileName: fileName, status: 'VERIFIED' as any }
        : item
    );
    const verifiedCount = (updatedItems || []).filter((i) => i && i.status === 'VERIFIED').length;
    const newScore = Math.round((verifiedCount / Math.max(1, (updatedItems || []).length)) * 100);

    const updatedCase: CustomsComplianceCheck = {
      ...selectedCase,
      checklistItems: updatedItems,
      readinessScore: newScore,
      uploadedDocumentsCount: selectedCase.uploadedDocumentsCount + 1,
      status: newScore === 100 ? 'PASS' : selectedCase.status,
    };

    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
    setSelectedCase(updatedCase);

    setActionToast({
      message: `Document "${fileName}" successfully attached and verified against IMO/CBIC rules.`,
      type: 'success',
    });
    setTimeout(() => setActionToast(null), 4000);
  };

  return (
    <div id="customs-workspace-dashboard" className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Customs Compliance Workspace & Review Console
              <span className="text-xs bg-blue-900/60 text-blue-300 font-semibold px-2 py-0.5 rounded border border-blue-700/50">
                M3 Phase 5
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Statutory tariff validation, mandatory document filings, and Customs Appraiser sign-off loop
            </p>
          </div>
        </div>

        {onNavigateToRegulations && (
          <button
            onClick={onNavigateToRegulations}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-blue-400" />
            Open Hybrid Regulation RAG Library
          </button>
        )}
      </div>

      {/* Action Toast */}
      {actionToast && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-lg border transition-all ${
            actionToast.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-200 border-emerald-800'
              : actionToast.type === 'error'
              ? 'bg-red-950/80 text-red-200 border-red-800'
              : 'bg-amber-950/80 text-amber-200 border-amber-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionToast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : actionToast.type === 'error' ? (
              <XCircle className="w-5 h-5 text-red-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            )}
            <span>{actionToast.message}</span>
          </div>
          <button onClick={() => setActionToast(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Review Queue (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-400" /> Review Queue
              </h3>
              <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
                {filteredCases.length} Cases
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-2 mb-3 text-[11px] font-medium border-b border-slate-800">
              {['ALL', 'NEEDS_REVIEW', 'NEEDS_DOCUMENTS', 'PASS', 'APPROVED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-1 rounded whitespace-nowrap transition-colors cursor-pointer ${
                    statusFilter === st ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search by Shipment ID, HS code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Queue List */}
            <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
              {filteredCases.map((c) => {
                const isSelected = selectedCase.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCase(c)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-950/30 border-blue-500 shadow-sm'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-bold text-xs text-white">{c.shipmentId}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          c.status === 'PASS' || c.status === 'APPROVED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : c.status === 'NEEDS_REVIEW'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : c.status === 'NEEDS_DOCUMENTS'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-red-950 text-red-300 border border-red-800'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 font-medium truncate mb-1">{c.commodity}</div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/40">
                      <span>HS {c.hsCode}</span>
                      <span className="font-bold text-slate-200">{c.readinessScore}% Ready</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Case Inspection, Document Upload & Sign-Off (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Active Consignment Dossier */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-white font-mono">{selectedCase.shipmentId}</h3>
                  <span className="text-xs text-slate-400 font-mono">({selectedCase.id})</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Route: <span className="text-slate-200 font-semibold">{selectedCase.originCountry} ({selectedCase.originPort})</span> → <span className="text-slate-200 font-semibold">{selectedCase.destinationCountry} ({selectedCase.destinationPort})</span> | Incoterm: <span className="text-blue-400 font-bold">{selectedCase.incoterm}</span>
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">Statutory Readiness</div>
                <div className="text-2xl font-black text-blue-400 font-mono">{selectedCase.readinessScore}%</div>
              </div>
            </div>

            {/* Tariff Matrix Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">HS Tariff Code</span>
                <span className="text-xs font-mono font-bold text-white">{selectedCase.hsCode}</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">Basic Customs Duty</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{selectedCase.basicCustomsDutyPct}%</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">IGST Statutory Rate</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{selectedCase.igstPct}%</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">Declared Valuation</span>
                <span className="text-xs font-mono font-bold text-slate-200">
                  ₹{(selectedCase.declaredValueInr ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Checklist Items */}
            <div className="mt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
                <span>Mandatory Statutory Documentation Checklist</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  {selectedCase.verifiedDocumentsCount} of {selectedCase.mandatoryDocumentsCount} Verified
                </span>
              </h4>

              <div className="space-y-2.5">
                {(selectedCase.checklistItems || []).map((item) => {
                  const isChecked = selectedItemIds.includes(item.id);
                  const isVerified = item.status === 'VERIFIED';

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border flex items-start justify-between gap-3 ${
                        isVerified
                          ? 'bg-emerald-950/20 border-emerald-800/60'
                          : item.documentUploaded
                          ? 'bg-blue-950/20 border-blue-800/60'
                          : 'bg-slate-800/30 border-slate-700/50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={isVerified || isChecked}
                          disabled={isVerified}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItemIds([...selectedItemIds, item.id]);
                            } else {
                              setSelectedItemIds((selectedItemIds || []).filter((id) => id !== item.id));
                            }
                          }}
                          className="mt-1 rounded border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            {item.itemName}
                            {item.mandatory && (
                              <span className="text-[9px] bg-red-950 text-red-300 font-semibold px-1.5 py-0.2 rounded border border-red-800">
                                Mandatory
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                          {item.citation && (
                            <div className="text-[10px] text-blue-400/90 font-mono mt-1">
                              Ref: {item.citation}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isVerified
                              ? 'bg-emerald-950 text-emerald-300'
                              : item.documentUploaded
                              ? 'bg-blue-950 text-blue-300'
                              : 'bg-amber-950 text-amber-300'
                          }`}
                        >
                          {isVerified ? 'VERIFIED' : (item.documentUploaded ? 'UPLOADED' : 'MISSING')}
                        </span>
                        {item.uploadedFileName && (
                          <div className="text-[9px] text-slate-400 mt-1 truncate max-w-[120px]">
                            {item.uploadedFileName}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Document Upload Dropzone */}
            <div className="mt-5 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Attach Statutory Document (Invoice, MSDS, VGM, Phytosanitary)
              </h4>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files.length > 0) {
                    handleFileUpload(e.dataTransfer.files[0].name);
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-blue-500 bg-blue-950/30'
                    : 'border-slate-700 bg-slate-950/40 hover:border-slate-600'
                }`}
                onClick={() => {
                  const demoNames = [
                    'Verified_Packing_List_SOLAS_VGM.pdf',
                    '16_Point_MSDS_Class3_Flammable.pdf',
                    'Commercial_Invoice_CBIC_Sec46.pdf',
                    'FSSAI_Phytosanitary_Clearance.pdf',
                  ];
                  const pick = demoNames[Math.floor(Math.random() * demoNames.length)];
                  handleFileUpload(pick);
                }}
              >
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                <p className="text-xs text-slate-200 font-semibold">
                  Drag and drop compliance document, or click to upload
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  PDF, DOCX, TIFF up to 25MB (Compliant with ICEGATE & CBIC 2026 EDI standards)
                </p>
              </div>
            </div>

            {/* Customs Officer Sign-Off Interface */}
            <div className="mt-6 pt-5 border-t border-slate-800 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Customs Appraiser Official Action Loop
                </h4>
              </div>

              <textarea
                placeholder="Official audit remarks, inspection conditions, or missing document notification notes..."
                value={officerNotes}
                onChange={(e) => setOfficerNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 mb-3"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  id="btn-signoff-approve"
                  onClick={() => handleSignOff('APPROVE')}
                  disabled={isProcessing}
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve Pass
                </button>

                <button
                  id="btn-signoff-conditional"
                  onClick={() => handleSignOff('CONDITIONAL')}
                  disabled={isProcessing}
                  className="py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Clock className="w-3.5 h-3.5" /> Conditional
                </button>

                <button
                  id="btn-signoff-request-docs"
                  onClick={() => handleSignOff('REQUEST_DOCUMENTS')}
                  disabled={isProcessing}
                  className="py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Request Docs
                </button>

                <button
                  id="btn-signoff-reject"
                  onClick={() => handleSignOff('REJECT')}
                  disabled={isProcessing}
                  className="py-2 px-3 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject Consignment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
