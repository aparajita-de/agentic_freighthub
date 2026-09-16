import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Info,
  ShieldCheck,
  FileCheck2,
  Check,
  ExternalLink,
  Filter,
  Trash2
} from 'lucide-react';
import { PlatformNotification, UserRole } from '../types';
import {
  getStoredNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/notificationService';

interface CustomerNotificationPanelProps {
  userRole?: UserRole;
  userEmail?: string;
  onNavigateToQuote?: (quoteId: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const CustomerNotificationPanel: React.FC<CustomerNotificationPanelProps> = ({
  userRole = 'customer',
  userEmail,
  onNavigateToQuote,
  onNavigateToTab,
}) => {
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'UNREAD' | 'ACTION_REQUIRED'>('ALL');

  const refreshNotifications = () => {
    const all = getStoredNotifications();
    // Filter relevant to this user or customer role
    const relevant = all.filter((n) => {
      if (userRole === 'customer') return n.targetRole === 'customer';
      if (userRole === 'freight-agent') return n.targetRole === 'freight-agent';
      if (userRole === 'customs-officer') return n.targetRole === 'customs-officer';
      return true;
    });
    setNotifications(relevant);
  };

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 3000);
    return () => clearInterval(interval);
  }, [userRole, userEmail]);

  const handleMarkAsRead = (id: string) => {
    const updated = markNotificationAsRead(id);
    setNotifications(updated.filter((n) => userRole === 'customer' ? n.targetRole === 'customer' : true));
  };

  const handleMarkAllRead = () => {
    const updated = markAllNotificationsAsRead(userRole);
    setNotifications(updated.filter((n) => userRole === 'customer' ? n.targetRole === 'customer' : true));
  };

  const filtered = notifications.filter((n) => {
    if (filterType === 'UNREAD') return !n.isRead;
    if (filterType === 'ACTION_REQUIRED') return n.type === 'action_required';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center relative">
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-black flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Notifications & Alerts Desk</h2>
            <p className="text-xs text-slate-500 font-medium">
              Real-time company verification, carrier feedback, and customs clearance updates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterType === 'ALL'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilterType('UNREAD')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterType === 'UNREAD'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilterType('ACTION_REQUIRED')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterType === 'ACTION_REQUIRED'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Action Required ({notifications.filter(n => n.type === 'action_required').length})
        </button>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-sm font-bold text-slate-700">All Caught Up!</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No new alerts or verification notifications at this moment. You will be notified as soon as carriers or customs officers update your consignments.
            </p>
          </div>
        ) : (
          filtered.map((notif) => {
            const isAction = notif.type === 'action_required';
            const isSuccess = notif.type === 'success';

            return (
              <div
                key={notif.id}
                onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${
                  !notif.isRead
                    ? 'bg-blue-50/40 border-blue-200 shadow-sm'
                    : 'bg-white border-slate-100 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    isSuccess
                      ? 'bg-emerald-100 text-emerald-700'
                      : isAction
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {isSuccess ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isAction ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <Info className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-slate-900">{notif.title}</span>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                      )}
                      {notif.quoteId && (
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {notif.quoteId}
                        </span>
                      )}
                      {notif.bookingId && (
                        <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                          {notif.bookingId}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(notif.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {notif.quoteId && onNavigateToQuote && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notif.id);
                        onNavigateToQuote(notif.quoteId!);
                      }}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Review Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {notif.actionView === 'tracking' && onNavigateToTab && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notif.id);
                        onNavigateToTab('tracking');
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>View Shipment</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
