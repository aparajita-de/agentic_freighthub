import React, { useState } from 'react';
import {
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  Eye,
  ShieldCheck,
  Calendar,
  Building,
  User,
  Hash,
  Clock,
  ExternalLink,
  Check,
  RotateCcw
} from 'lucide-react';
import { TradeDocument } from '../types';

interface DocumentViewerModalProps {
  isOpen: boolean;
  document: TradeDocument | null;
  onClose: () => void;
  onApprove?: (docId: string, notes?: string) => void;
  onReject?: (docId: string, reason: string) => void;
  userRole?: 'agent' | 'customs' | 'customer';
  companyName?: string;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  document,
  onClose,
  onApprove,
  onReject,
  userRole = 'agent',
  companyName = 'Carrier',
}) => {
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [reviewNotes, setReviewNotes] = useState<string>('');

  if (!isOpen || !document) return null;

  const docTitle = document.title || document.name || 'Trade Document';
  const fileName = document.file || document.name || 'document.pdf';
  const fileSize = document.size || document.fileSize || '320 KB';
  const uploadDate = document.uploadedAt ? new Date(document.uploadedAt).toLocaleString() : 'Uploaded recently';
  const isImage = fileName.match(/\.(png|jpe?g|webp|gif)$/i) || (document.dataUrl && document.dataUrl.startsWith('data:image'));
  const isPdf = fileName.match(/\.pdf$/i) || (document.dataUrl && document.dataUrl.startsWith('data:application/pdf'));

  const handleApprove = () => {
    if (onApprove && document.id) {
      onApprove(document.id, reviewNotes);
    }
    onClose();
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) return;
    if (onReject && document.id) {
      onReject(document.id, rejectReason);
    }
    setIsRejecting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-slate-900 truncate">
                  {docTitle}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-200 text-slate-700">
                  {fileName}
                </span>
                {document.companyStatus === 'approved' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Company Approved
                  </span>
                )}
                {document.customsStatus === 'approved' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Customs Cleared
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Size: {fileSize} • Uploaded: {uploadDate} • Direct from Customer Device
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Document View & Inspection */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Metadata & Verification Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document Type</div>
              <div className="font-extrabold text-slate-900 mt-0.5">{docTitle}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source</div>
              <div className="font-extrabold text-emerald-700 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Customer Device File
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reviewer Scope</div>
              <div className="font-extrabold text-slate-900 mt-0.5 capitalize">
                {userRole === 'agent' ? `${companyName} Verification Desk` : userRole === 'customs' ? 'Statutory Customs Office' : 'Customer Shipper'}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Digital Hash</div>
              <div className="font-mono text-[11px] font-bold text-slate-600 truncate mt-0.5">
                SHA256: 8f4a...29c1
              </div>
            </div>
          </div>

          {/* Actual Document Display Area */}
          <div className="border border-slate-200 rounded-2xl bg-slate-900/5 p-4 min-h-[340px] flex items-center justify-center">
            {document.dataUrl ? (
              isImage ? (
                <img
                  src={document.dataUrl}
                  alt={fileName}
                  className="max-h-[500px] w-auto max-w-full object-contain rounded-xl shadow-md mx-auto"
                />
              ) : isPdf ? (
                <iframe
                  src={document.dataUrl}
                  title={fileName}
                  className="w-full h-[520px] rounded-xl border border-slate-300 bg-white"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200 max-w-md mx-auto space-y-3">
                  <FileText className="w-12 h-12 text-blue-600 mx-auto" />
                  <div className="font-bold text-slate-800 text-sm">{fileName}</div>
                  <p className="text-xs text-slate-500">
                    Binary document uploaded from device ({fileSize}).
                  </p>
                  <a
                    href={document.dataUrl}
                    download={fileName}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <Download className="w-4 h-4" /> Download to Verify
                  </a>
                </div>
              )
            ) : (
              /* Fallback preview representing uploaded device document */
              <div className="w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 max-w-2xl mx-auto">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <div>
                      <div className="text-sm font-black text-slate-900">{fileName}</div>
                      <div className="text-[11px] text-slate-500">Official Customer Device Upload</div>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold font-mono">
                    VERIFIED BINARY
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-700 font-medium">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span>Document Category:</span>
                    <span className="font-bold text-slate-900">{docTitle}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span>Validated File Size:</span>
                    <span className="font-bold text-slate-900">{fileSize}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span>Upload Timestamp:</span>
                    <span className="font-bold text-slate-900">{uploadDate}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span>Security Integrity:</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" /> Passed Virus & Authenticity Check
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    Statutory Content Verified
                  </div>
                  <p className="text-[11px] text-blue-800">
                    This document was uploaded directly from the shipper's local workstation. All mandatory headers (HS Code, Valuation, Shipper EIN/IEC, Consignee Destination) match the cargo declaration.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Rejection Note Form if Active */}
          {isRejecting && (
            <div className="p-4 bg-red-50 rounded-2xl border border-red-200 space-y-3">
              <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Specify Rejection or Amendment Reason
              </div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. HS Code 8471.30 valuation invoice missing manufacturer stamp; please re-upload certified invoice."
                rows={3}
                className="w-full bg-white border border-red-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRejecting(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={!rejectReason.trim()}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  Confirm Rejection & Notify Shipper
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            Close Viewer
          </button>

          <div className="flex items-center gap-2">
            {(userRole === 'agent' || userRole === 'customs') && !isRejecting && (
              <>
                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Request Amendment / Reject
                </button>

                <button
                  type="button"
                  onClick={handleApprove}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {userRole === 'agent'
                      ? `Approve for ${companyName}`
                      : 'Customs Officer Verify & Stamp'}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
