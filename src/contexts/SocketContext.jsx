// ============================================
// UPDATED SocketContext.jsx
// Avoids crashing when no userProfile/token
// Supports multiple notification types: message, bid, job_started, work_completed
// ============================================

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import io from "socket.io-client";
import toast from 'react-hot-toast';
import { useNotifications } from '../hooks/useNotifications';
import { playNotificationSound } from '../utils/notificationSound';
import translations from '../locales/translations';

// Helper to get translated string without useLanguage hook (safe for context)
const getT = (key) => {
  const lang = localStorage.getItem('preferredLanguage') || 'fr';
  const keys = key.split('.');
  let value = translations[lang];
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
};

// Public pages where notifications should NOT be shown (user is not truly "logged in" to the app)
const PUBLIC_PAGES = ['/', '/landing', '/login', '/register', '/forgot-password', '/reset-password'];

// Helper function to check if current path is a public page
const checkIsPublicPage = () => {
  const pathname = window.location.pathname;
  return PUBLIC_PAGES.some(page => pathname === page || pathname.startsWith(page + '/'));
};

// Dismissible toast helper - shows a toast with a close (X) button.
// Legacy `icon` and `bg` args are accepted for backwards-compatibility but the icon
// is no longer rendered; `bg` is mapped to a left-border accent color so all toasts
// share the same white-card style as the global Toaster config.
const showDismissibleToast = (message, { icon: _icon, bg, ...options } = {}) => {
  const accentColor = bg === '#059669' ? '#059669'
    : bg === '#dc2626' ? '#dc2626'
    : bg === '#d97706' ? '#d97706'
    : bg === '#2563eb' ? '#2563eb'
    : '#00A5A9';

  toast(
    (t) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
        <span style={{ flex: 1, color: '#0F223D', fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.4 }}>{message}</span>
        <button
          onClick={() => toast.dismiss(t.id)}
          style={{
            background: 'none', border: 'none', color: '#9ca3af',
            cursor: 'pointer', padding: '2px 4px', fontSize: '18px', flexShrink: 0,
            lineHeight: 1,
          }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    ),
    {
      duration: options.duration || 5000,
      style: {
        background: '#ffffff',
        color: '#0F223D',
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1.4,
        padding: '12px 16px',
        minWidth: '320px',
        maxWidth: '320px',
        minHeight: '56px',
        borderRadius: '10px',
        border: '1px solid #e5e7eb',
        borderLeft: `4px solid ${accentColor}`,
        boxShadow: '0 4px 12px rgba(15, 34, 61, 0.08), 0 1px 3px rgba(15, 34, 61, 0.06)',
        ...options.style,
      },
    }
  );
};

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const { showNotification, requestPermission } = useNotifications();

  // Auth version - increment this to trigger socket re-initialization after login
  const [authVersion, setAuthVersion] = useState(0);

  // Track if we've already shown login toasts this session (survives page refresh within tab)
  const getHasShownToasts = () => sessionStorage.getItem('notif_toasts_shown') === 'true';
  const setHasShownToasts = (val) => sessionStorage.setItem('notif_toasts_shown', val ? 'true' : 'false');

  // Function to reinitialize socket (call this after login)
  const reinitializeSocket = useCallback(() => {
    console.log("🔄 Reinitializing socket connection...");
    setAuthVersion(prev => prev + 1);
  }, []);

  // Use refs to avoid stale closures in socket listeners
  const showNotificationRef = useRef(showNotification);

  useEffect(() => {
    showNotificationRef.current = showNotification;
  }, [showNotification]);

  // Request notification permission on mount
  useEffect(() => {
    requestPermission();
  }, []);

  // Fetch notifications from backend API
  const fetchNotifications = useCallback(async () => {
    try {
      const userProfile = localStorage.getItem("userProfile");
      if (!userProfile) return;

      const user = JSON.parse(userProfile);
      const token = user?.token;
      if (!token) return;

      setIsLoadingNotifications(true);
      const apiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";

      const response = await fetch(`${apiUrl}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Transform backend notifications to match our format
        const formattedNotifications = (data.notifications || []).map(n => ({
          id: n.id,
          read: n.is_read || n.read || false,
          timestamp: n.created_at || n.timestamp,
          type: n.type,
          // Message notification fields
          senderName: n.sender_name || n.senderName,
          senderId: n.sender_id || n.senderId,
          content: n.content || n.message,
          conversationId: n.conversation_id || n.conversationId,
          // Bid notification fields
          bidder: n.bidder_name || n.bidder,
          bidderId: n.bidder_id || n.bidderId,
          jobId: n.job_id || n.jobId,
          jobTitle: n.job_title || n.jobTitle,
          property: n.property_name || n.property,
          apartment: n.unit_name || n.apartment,
          budget: n.bid_amount || n.budget,
          licenseNumber: n.license_number || n.licenseNumber,
          submissionDate: n.submission_date || n.submissionDate,
          // Job started/completed fields
          contractor: n.contractor_name || n.contractor,
          contractorId: n.contractor_id || n.contractorId,
          workTitle: n.work_title || n.workTitle,
          startDate: n.start_date || n.startDate,
          completionDate: n.completion_date || n.completionDate,
        }));

        setNotifications(formattedNotifications);
        console.log("📥 Loaded", formattedNotifications.length, "notifications from backend");

        // Show toast + sound for unread notifications received while offline
        // Only show once per session (not on every reconnect)
        const unreadNotifications = formattedNotifications.filter(n => !n.read);
        const userRole = user?.role;

        console.log("🔔 Notification check:", {
          unreadCount: unreadNotifications.length,
          userRole,
          hasShownBefore: getHasShownToasts(),
          isPublicPage: checkIsPublicPage(),
          shouldShowToast: unreadNotifications.length > 0 && !getHasShownToasts() && !checkIsPublicPage()
        });

        // Don't show toasts on public pages (landing, login, etc.)
        if (unreadNotifications.length > 0 && !getHasShownToasts() && !checkIsPublicPage()) {
          setHasShownToasts(true); // Mark as shown for this session

          // Play sound once for all unread notifications
          playNotificationSound();

          // Show a summary toast if there are multiple unread
          if (unreadNotifications.length > 3) {
            showDismissibleToast(
              getT('notifications.notificationCountPlural').replace('{{count}}', unreadNotifications.length),
              { icon: '🔔' }
            );
          } else {
            // Show individual toasts for up to 3 unread notifications
            unreadNotifications.slice(0, 3).forEach((notif, index) => {
              setTimeout(() => {
                const toastMap = {
                  bid: { msg: getT('notifications.newBid').replace('{{name}}', notif.bidder || getT('notifications.defaultContractor')), icon: '📋' },
                  message: { msg: getT('notifications.messageFrom').replace('{{name}}', notif.senderName || getT('notifications.defaultSomeone')), icon: '💬' },
                  started: { msg: getT('notifications.workStarted').replace('{{name}}', notif.contractor || getT('notifications.defaultContractor')), icon: '🔨' },
                  completed: { msg: getT('notifications.workCompleted').replace('{{name}}', notif.contractor || getT('notifications.defaultContractor')), icon: '✅' },
                  bid_approved: { msg: getT('notifications.bidApprovedBody').replace('{{job}}', notif.jobTitle || ''), icon: '🎉', bg: '#059669', duration: 8000 },
                  bid_declined: { msg: getT('notifications.bidDeclinedBody').replace('{{job}}', notif.jobTitle || ''), icon: '😔', bg: '#dc2626', duration: 8000 },
                };
                const config = toastMap[notif.type] || { msg: getT('notifications.notification'), icon: '🔔' };
                showDismissibleToast(config.msg, { icon: config.icon, bg: config.bg, duration: config.duration });
              }, index * 500);
            });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, []);

  // NOTE: We don't fetch notifications on mount anymore
  // Notifications are fetched when socket connects (which only happens when user is logged in)
  // This prevents toasts from appearing on the landing page

  // Add a new notification to the list - using direct setState to avoid stale closure
  const addNotificationDirect = (notification) => {
    const newNotification = {
      id: Date.now(),
      read: false,
      timestamp: new Date().toISOString(),
      ...notification,
    };
    setNotifications(prev => [newNotification, ...prev]);
    return newNotification;
  };

  // Wrapped version for external use
  const addNotification = useCallback((notification) => {
    return addNotificationDirect(notification);
  }, []);

  // Mark notification as read (also sync to backend)
  const markAsRead = useCallback(async (notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );

    // Sync to backend
    try {
      const userProfile = localStorage.getItem("userProfile");
      if (!userProfile) return;
      const user = JSON.parse(userProfile);
      const token = user?.token;
      if (!token) return;

      const apiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";
      await fetch(`${apiUrl}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  // Mark all notifications as read (also sync to backend)
  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    // Sync to backend
    try {
      const userProfile = localStorage.getItem("userProfile");
      if (!userProfile) return;
      const user = JSON.parse(userProfile);
      const token = user?.token;
      if (!token) return;

      const apiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";
      await fetch(`${apiUrl}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, []);

  // Clear all notifications (called on logout)
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    // Reset the toast flag so new user will see their notifications
    setHasShownToasts(false);
    console.log("🧹 Notifications cleared and toast flag reset");
  }, []);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const userProfile = localStorage.getItem("userProfile");

    // ✅ Skip socket setup if no profile or no token
    if (!userProfile) {
      console.log("⚠️ No userProfile found — socket not initialized");
      setSocket(null);
      setIsConnected(false);
      setNotifications([]); // Clear notifications when logged out
      setHasShownToasts(false); // Reset toast flag for next login
      return;
    }

    const user = JSON.parse(userProfile);
    const token = user?.token;

    if (!token) {
      console.log("⚠️ No token found — socket not initialized");
      setSocket(null);
      setIsConnected(false);
      setNotifications([]); // Clear notifications when logged out
      setHasShownToasts(false); // Reset toast flag for next login
      return;
    }

    // Get API URL
    const apiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";
    console.log("🔌 Initializing socket connection to:", apiUrl);
    console.log("🔑 Token present:", !!token);
    console.log("📋 Environment:", import.meta.env.MODE);

    // ✅ Initialize Socket.io connection
    const newSocket = io(apiUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 120000, // 120 seconds to handle Render cold starts
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
      console.log("✅ Socket transport:", newSocket.io.engine.transport.name);
      setIsConnected(true);

      // Fetch notifications when socket connects (user logged in)
      fetchNotifications();
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      console.error("❌ Error type:", error.type);
      console.error("❌ Error description:", error.description);
      console.error("❌ Full error:", error);
      setIsConnected(false);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      setIsConnected(false);
    });

    // Listen for message notifications
    newSocket.on("message_notification", (data) => {
      console.log("📬 New message notification:", data);

      const senderName = data.senderName || 'Someone';
      const messagePreview = data.content ? data.content.substring(0, 50) + (data.content.length > 50 ? '...' : '') : 'New message';

      // Add to notifications list (using direct setState)
      setNotifications(prev => [{
        id: Date.now(),
        read: false,
        timestamp: new Date().toISOString(),
        type: 'message',
        senderName,
        senderId: data.senderId,
        content: messagePreview,
        conversationId: data.conversationId,
      }, ...prev]);

      // Skip toasts/sounds on public pages
      if (checkIsPublicPage()) {
        console.log("📬 Skipping toast - user is on public page");
        return;
      }

      // Play notification sound
      playNotificationSound();

      // Show toast notification
      showDismissibleToast(getT('notifications.messageFrom').replace('{{name}}', senderName), { icon: '💬' });

      // Show desktop notification (if permission granted)
      if (showNotificationRef.current) {
        showNotificationRef.current(
          getT('notifications.messageFrom').replace('{{name}}', senderName),
          {
            body: messagePreview,
            tag: 'message-notification',
            requireInteraction: false,
          }
        );
      }
    });

    // Listen for new bid notifications
    newSocket.on("new_bid", (data) => {
      console.log("📋 New bid notification received:");
      console.log("   Current user ID:", user.id);
      console.log("   Current user role:", user.role);
      console.log("   Notification data:", data);

      const bidderName = data.bidderName || 'A contractor';
      const jobTitle = data.jobTitle || 'your job';
      const bidAmount = data.bidAmount ? `$${data.bidAmount.toLocaleString()}` : '';

      // Add to notifications list (using direct setState)
      setNotifications(prev => [{
        id: Date.now(),
        read: false,
        timestamp: new Date().toISOString(),
        type: 'bid',
        bidder: bidderName,
        bidderId: data.bidderId,
        jobId: data.jobId,
        jobTitle,
        property: data.propertyName || '',
        apartment: data.unitName || '',
        budget: data.bidAmount,
        licenseNumber: data.licenseNumber || 'N/A',
        submissionDate: new Date().toISOString(),
      }, ...prev]);

      // Skip toasts/sounds on public pages
      if (checkIsPublicPage()) {
        console.log("📋 Skipping toast - user is on public page");
        return;
      }

      // Play notification sound
      playNotificationSound();

      // Show toast notification
      showDismissibleToast(getT('notifications.newBid').replace('{{name}}', bidderName), { icon: '📋' });

      // Show desktop notification
      if (showNotificationRef.current) {
        showNotificationRef.current(
          getT('notifications.newBid').replace('{{name}}', bidderName),
          {
            body: `${bidderName} submitted a bid ${bidAmount ? `of ${bidAmount}` : ''} for ${jobTitle}`,
            tag: 'bid-notification',
            requireInteraction: false,
          }
        );
      }
    });

    // Listen for job invite notifications — a PM directly invited this
    // contractor to bid on one of their jobs (fired from jobInviteController).
    newSocket.on("job_invite", (data) => {
      const senderName = data.senderName || 'A property manager';
      const jobTitle = data.jobTitle || 'a job';

      setNotifications(prev => [{
        id: Date.now(),
        read: false,
        timestamp: new Date().toISOString(),
        type: 'job_invite',
        senderName,
        senderId: data.senderId,
        jobId: data.jobId,
        jobTitle,
        content: data.content || `${senderName} invited you to bid on "${jobTitle}".`,
      }, ...prev]);

      if (checkIsPublicPage()) return;

      playNotificationSound();
      showDismissibleToast(
        getT('notifications.jobInvite').replace('{{name}}', senderName),
        { icon: '📩' }
      );

      if (showNotificationRef.current) {
        showNotificationRef.current(
          getT('notifications.jobInvite').replace('{{name}}', senderName),
          {
            body: `${senderName} invited you to bid on "${jobTitle}"`,
            tag: 'job-invite',
            requireInteraction: false,
          }
        );
      }
    });

    // Listen for job started notifications (entrepreneur started work)
    newSocket.on("job_started", (data) => {
      console.log("🔨 Job started notification:", data);

      const contractorName = data.contractorName || 'Contractor';
      const jobTitle = data.jobTitle || 'the job';

      // Add to notifications list (using direct setState)
      setNotifications(prev => [{
        id: Date.now(),
        read: false,
        timestamp: new Date().toISOString(),
        type: 'started',
        contractor: contractorName,
        contractorId: data.contractorId,
        jobId: data.jobId,
        jobTitle,
        property: data.propertyName || '',
        apartment: data.unitName || '',
        startDate: new Date().toISOString(),
      }, ...prev]);

      // Skip toasts/sounds on public pages
      if (checkIsPublicPage()) {
        console.log("🔨 Skipping toast - user is on public page");
        return;
      }

      // Play notification sound
      playNotificationSound();

      // Show toast notification
      showDismissibleToast(getT('notifications.workStarted').replace('{{name}}', contractorName), { icon: '🔨' });

      // Show desktop notification
      if (showNotificationRef.current) {
        showNotificationRef.current(
          getT('notifications.workStarted').replace('{{name}}', contractorName),
          {
            body: `${contractorName} has started working on ${jobTitle}`,
            tag: 'job-started-notification',
            requireInteraction: false,
          }
        );
      }
    });

    // Listen for work completed notifications
    newSocket.on("work_completed", (data) => {
      console.log("✅ Work completed notification:", data);

      const contractorName = data.contractorName || 'Contractor';
      const jobTitle = data.jobTitle || 'the job';

      // Add to notifications list (using direct setState)
      setNotifications(prev => [{
        id: Date.now(),
        read: false,
        timestamp: new Date().toISOString(),
        type: 'completed',
        contractor: contractorName,
        contractorId: data.contractorId,
        jobId: data.jobId,
        workTitle: jobTitle,
        property: data.propertyName || '',
        apartment: data.unitName || '',
        completionDate: new Date().toISOString(),
      }, ...prev]);

      // Skip toasts/sounds on public pages
      if (checkIsPublicPage()) {
        console.log("✅ Skipping toast - user is on public page");
        return;
      }

      // Play notification sound
      playNotificationSound();

      // Show toast notification
      showDismissibleToast(getT('notifications.workCompleted').replace('{{name}}', contractorName), { icon: '✅' });

      // Show desktop notification
      if (showNotificationRef.current) {
        showNotificationRef.current(
          getT('notifications.workCompleted').replace('{{name}}', contractorName),
          {
            body: `${contractorName} has completed ${jobTitle}`,
            tag: 'work-completed-notification',
            requireInteraction: false,
          }
        );
      }
    });

    // Listen for bid approved notifications (for entrepreneurs)
    newSocket.on("bid_approved", (data) => {
      console.log("🎉 Bid approved notification received:");
      console.log("   Current user ID:", user.id);
      console.log("   Current user role:", user.role);
      console.log("   Notification data:", data);

      const jobTitle = data.jobTitle || 'a job';
      const bidAmount = data.bidAmount ? `$${Number(data.bidAmount).toLocaleString()}` : '';

      // Add to notifications list
      setNotifications(prev => [{
        id: Date.now(),
        read: false,
        timestamp: new Date().toISOString(),
        type: 'bid_approved',
        jobId: data.jobId,
        jobTitle,
        property: data.propertyName || '',
        budget: data.bidAmount,
        content: data.message,
      }, ...prev]);

      // Skip toasts/sounds on public pages
      if (checkIsPublicPage()) {
        console.log("🎉 Skipping toast - user is on public page");
        return;
      }

      // Play notification sound
      playNotificationSound();

      // Show toast notification with success styling
      showDismissibleToast(
        getT('notifications.bidApprovedBody').replace('{{job}}', jobTitle),
        { icon: '🎉', bg: '#059669', duration: 8000 }
      );

      // Show desktop notification
      if (showNotificationRef.current) {
        showNotificationRef.current(
          getT('notifications.bidApproved'),
          {
            body: data.message || `Your bid ${bidAmount ? `of ${bidAmount}` : ''} for ${jobTitle} has been approved!`,
            tag: 'bid-approved-notification',
            requireInteraction: true,
          }
        );
      }
    });

    // Listen for bid declined notifications (for entrepreneurs)
    newSocket.on("bid_declined", (data) => {
      console.log("❌ Bid declined notification received:");
      console.log("   Current user ID:", user.id);
      console.log("   Current user role:", user.role);
      console.log("   Notification data:", data);

      const jobTitle = data.jobTitle || 'a job';

      // Add to notifications list
      setNotifications(prev => [{
        id: Date.now(),
        read: false,
        timestamp: new Date().toISOString(),
        type: 'bid_declined',
        jobId: data.jobId,
        jobTitle,
        property: data.propertyName || '',
        budget: data.bidAmount,
        content: data.message,
        reason: data.reason, // 'another_accepted' or 'manager_declined'
      }, ...prev]);

      // Skip toasts/sounds on public pages
      if (checkIsPublicPage()) {
        console.log("❌ Skipping toast - user is on public page");
        return;
      }

      // Play notification sound
      playNotificationSound();

      // Show toast notification with error styling
      showDismissibleToast(
        getT('notifications.bidDeclinedBody').replace('{{job}}', jobTitle),
        { icon: '😔', bg: '#dc2626', duration: 8000 }
      );

      // Show desktop notification
      if (showNotificationRef.current) {
        showNotificationRef.current(
          getT('notifications.bidDeclined'),
          {
            body: data.message || `Your bid for ${jobTitle} was not selected.`,
            tag: 'bid-declined-notification',
            requireInteraction: false,
          }
        );
      }
    });

    // Listen for payout received notifications (for entrepreneurs)
    // Use a ref to track recent payouts and prevent duplicate toasts
    const recentPayoutsRef = { current: new Set() };

    newSocket.on("payout_received", (data) => {
      console.log("💰 Payout received notification:");
      console.log("   Contract ID:", data.contractId);
      console.log("   Job ID:", data.jobId);
      console.log("   Amount:", data.amount);

      // Prevent duplicate notifications for the same contract
      const payoutKey = `${data.contractId}-${data.jobId}`;
      if (recentPayoutsRef.current.has(payoutKey)) {
        console.log("💰 Skipping duplicate payout notification for:", payoutKey);
        return;
      }
      recentPayoutsRef.current.add(payoutKey);

      // Clear from set after 10 seconds to allow future notifications
      setTimeout(() => {
        recentPayoutsRef.current.delete(payoutKey);
      }, 10000);

      // Skip toasts/sounds on public pages
      if (checkIsPublicPage()) {
        console.log("💰 Skipping toast - user is on public page");
        return;
      }

      // Play notification sound
      playNotificationSound();

      // Show toast notification with success styling
      const amountFormatted = data.amount ? `$${Number(data.amount).toLocaleString()}` : 'Payment';
      showDismissibleToast(
        getT('notifications.payoutToast').replace('{{amount}}', amountFormatted),
        { icon: '💰', bg: '#059669', duration: 8000 }
      );

      // Show desktop notification
      if (showNotificationRef.current) {
        showNotificationRef.current(
          getT('notifications.payoutDesktop'),
          {
            body: getT('notifications.payoutToast').replace('{{amount}}', amountFormatted),
            tag: `payout-${data.contractId}`,
            requireInteraction: true,
          }
        );
      }
    });

    // Completion confirmed by one party
    newSocket.on("completion_confirmed", (data) => {
      console.log("Completion confirmed notification:", data);

      setNotifications(prev => [{
        id: Date.now(),
        read: false,
        timestamp: new Date().toISOString(),
        type: 'completion_confirmed',
        jobId: data.jobId,
        jobTitle: data.jobTitle,
        content: `${data.confirmerName} confirmed job completion for "${data.jobTitle}"`,
      }, ...prev]);

      if (checkIsPublicPage()) return;
      playNotificationSound();
      showDismissibleToast(
        getT('notifications.completionConfirmed').replace('{{name}}', data.confirmerName),
        { icon: '✅' }
      );
    });

    // Review invitation (both parties confirmed)
    newSocket.on("review_invitation", (data) => {
      console.log("Review invitation received:", data);

      setNotifications(prev => [{
        id: Date.now(),
        read: false,
        timestamp: new Date().toISOString(),
        type: 'review_invitation',
        jobId: data.jobId,
        jobTitle: data.jobTitle,
        content: `Leave a review for ${data.revieweeName} on "${data.jobTitle}"`,
        revieweeId: data.revieweeId,
        revieweeName: data.revieweeName,
        suggestedRating: data.suggestedRating,
      }, ...prev]);

      if (checkIsPublicPage()) return;
      playNotificationSound();
      showDismissibleToast(
        getT('notifications.reviewInvitation').replace('{{name}}', data.revieweeName),
        { icon: '⭐', bg: '#059669', duration: 8000 }
      );
    });

    // Bid approval cancelled by manager
    newSocket.on("bid_approval_cancelled", (data) => {
      console.log("Bid approval cancelled:", data);
      setNotifications(prev => [{
        id: `bid_cancelled_${Date.now()}`,
        is_read: false,
        timestamp: new Date().toISOString(),
        type: 'bid_approval_cancelled',
        jobId: data.jobId,
        content: data.message,
      }, ...prev]);

      if (checkIsPublicPage()) return;
      playNotificationSound();
      showDismissibleToast(
        data.message || getT('notifications.bidCancelled').replace('{{job}}', data.jobTitle || ''),
        { icon: '⚠️', bg: '#d97706', duration: 8000 }
      );
    });

    // Job deleted by manager
    newSocket.on("job_deleted", (data) => {
      console.log("Job deleted notification:", data);
      setNotifications(prev => [{
        id: `job_deleted_${Date.now()}`,
        is_read: false,
        timestamp: new Date().toISOString(),
        type: 'job_deleted',
        jobId: data.jobId,
        content: data.message,
      }, ...prev]);

      if (checkIsPublicPage()) return;
      playNotificationSound();
      showDismissibleToast(
        data.message || getT('notifications.jobDeleted').replace('{{job}}', data.jobTitle || ''),
        { icon: '🗑️', bg: '#dc2626', duration: 8000 }
      );
    });

    // Job reopened (bid restored after acceptance cancellation)
    newSocket.on("job_reopened", (data) => {
      console.log("Job reopened notification:", data);
      setNotifications(prev => [{
        id: `job_reopened_${Date.now()}`,
        is_read: false,
        timestamp: new Date().toISOString(),
        type: 'job_reopened',
        jobId: data.jobId,
        content: data.message,
      }, ...prev]);

      if (checkIsPublicPage()) return;
      playNotificationSound();
      showDismissibleToast(
        data.message || getT('notifications.jobReopened'),
        { icon: '🔄', bg: '#2563eb', duration: 8000 }
      );
    });

    setSocket(newSocket);

    return () => {
      console.log("🧹 Cleaning up socket connection...");
      newSocket.disconnect();
      setIsConnected(false);
    };
  }, [fetchNotifications, authVersion]);

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      notifications,
      unreadCount,
      isLoadingNotifications,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications,
      fetchNotifications,
      reinitializeSocket,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
