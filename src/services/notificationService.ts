import { PlatformNotification } from '../types';

const NOTIFICATIONS_STORAGE_KEY = 'freighthub_platform_notifications_v1';

export const INITIAL_NOTIFICATIONS: PlatformNotification[] = [
  {
    id: 'NOTIF-1',
    targetRole: 'customer',
    targetUserEmail: 'customer@freightai.com',
    quoteId: 'QTE-E90C17CA',
    selectionRef: 'SEL-FA319C2A',
    title: 'Carrier Verification In Progress',
    message: 'Your quote request for Mumbai (INNSA) to Singapore (SGSIN) has been sent to Maersk Line Freight Desk for operational & AI verification.',
    type: 'info',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    isRead: false,
    actionView: 'selected-quotes',
  },
  {
    id: 'NOTIF-2',
    targetRole: 'customer',
    targetUserEmail: 'customer@freightai.com',
    quoteId: 'QTE-CA37214A',
    selectionRef: 'SEL-CA37214A',
    bookingId: 'BK-2026-10001',
    title: 'Customs Officer Clearance Granted',
    message: 'Out-Of-Charge certificate CC-QTE-CA37214A issued by Chief Customs Officer. Final booking confirmed!',
    type: 'success',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    isRead: true,
    actionView: 'tracking',
  },
  {
    id: 'NOTIF-3',
    targetRole: 'freight-agent',
    quoteId: 'QTE-E90C17CA',
    selectionRef: 'SEL-FA319C2A',
    title: 'New Carrier Verification Request',
    message: 'Customer selected Maersk for 18,500 kg electronics consignment. AI Risk Analysis ready for review.',
    type: 'action_required',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    isRead: false,
    actionView: 'company-verification',
  },
  {
    id: 'NOTIF-4',
    targetRole: 'customs-officer',
    quoteId: 'QTE-E90C17CA',
    title: 'Consignment Awaiting Regulatory Review',
    message: 'Shipper submitted 4 clearance documents (INV, PL, BL, COO) for HS Code 8471.30. Ready for inspection.',
    type: 'action_required',
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    isRead: false,
    actionView: 'compliance-queue',
  },
];

export const getStoredNotifications = (): PlatformNotification[] => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading notifications from localStorage:', err);
  }
  return INITIAL_NOTIFICATIONS;
};

export const saveNotifications = (notifications: PlatformNotification[]): void => {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch (err) {
    console.error('Error writing notifications to localStorage:', err);
  }
};

export const addNotification = (
  notif: Omit<PlatformNotification, 'id' | 'timestamp' | 'isRead'>
): PlatformNotification => {
  const current = getStoredNotifications();
  const newNotif: PlatformNotification = {
    ...notif,
    id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    isRead: false,
  };
  const updated = [newNotif, ...current];
  saveNotifications(updated);
  return newNotif;
};

export const markNotificationAsRead = (id: string): PlatformNotification[] => {
  const current = getStoredNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, isRead: true } : n));
  saveNotifications(updated);
  return updated;
};

export const markAllNotificationsAsRead = (role?: string): PlatformNotification[] => {
  const current = getStoredNotifications();
  const updated = current.map((n) => (!role || n.targetRole === role ? { ...n, isRead: true } : n));
  saveNotifications(updated);
  return updated;
};
