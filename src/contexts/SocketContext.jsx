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

  // Track if we've already shown login toasts (to avoid showing on every reconnect)
  const hasShownLoginToastsRef = useRef(false);

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
          hasShownBefore: hasShownLoginToastsRef.current,
          shouldShowToast: unreadNotifications.length > 0 && !hasShownLoginToastsRef.current
        });

        if (unreadNotifications.length > 0 && !hasShownLoginToastsRef.current) {
          hasShownLoginToastsRef.current = true; // Mark as shown

          // Play sound once for all unread notifications
          playNotificationSound();

          // Show a summary toast if there are multiple unread
          if (unreadNotifications.length > 3) {
            toast.success(
              `You have ${unreadNotifications.length} unread notifications`,
              {
                duration: 5000,
                icon: '🔔',
                style: {
                  borderRadius: '10px',
                  background: '#333',
                  color: '#fff',
                },
              }
            );
          } else {
            // Show individual toasts for up to 3 unread notifications
            unreadNotifications.slice(0, 3).forEach((notif, index) => {
              setTimeout(() => {
                if (notif.type === 'bid') {
                  toast.success(
                    `New bid from ${notif.bidder || 'A contractor'}`,
                    {
                      duration: 5000,
                      icon: '📋',
                      style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                      },
                    }
                  );
                } else if (notif.type === 'message') {
                  toast.success(
                    `New message from ${notif.senderName || 'Someone'}`,
                    {
                      duration: 5000,
                      icon: '💬',
                      style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                      },
                    }
                  );
                } else if (notif.type === 'started') {
                  toast.success(
                    `${notif.contractor || 'Contractor'} started work`,
                    {
                      duration: 5000,
                      icon: '🔨',
                      style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                      },
                    }
                  );
                } else if (notif.type === 'completed') {
                  toast.success(
                    `${notif.contractor || 'Contractor'} completed work`,
                    {
                      duration: 5000,
                      icon: '✅',
                      style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                      },
                    }
                  );
                } else if (notif.type === 'bid_approved') {
                  toast.success(
                    notif.content || `Your bid for "${notif.jobTitle}" has been approved!`,
                    {
                      duration: 8000,
                      icon: '🎉',
                      style: {
                        borderRadius: '10px',
                        background: '#059669',
                        color: '#fff',
                      },
                    }
                  );
                } else if (notif.type === 'bid_declined') {
                  toast(
                    notif.content || `Your bid for "${notif.jobTitle}" was not selected.`,
                    {
                      duration: 8000,
                      icon: '😔',
                      style: {
                        borderRadius: '10px',
                        background: '#dc2626',
                        color: '#fff',
                      },
                    }
                  );
                }
              }, index * 500); // Stagger toasts by 500ms
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

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
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
      hasShownLoginToastsRef.current = false; // Reset toast flag for next login
      return;
    }

    const user = JSON.parse(userProfile);
    const token = user?.token;

    if (!token) {
      console.log("⚠️ No token found — socket not initialized");
      setSocket(null);
      setIsConnected(false);
      setNotifications([]); // Clear notifications when logged out
      hasShownLoginToastsRef.current = false; // Reset toast flag for next login
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

      // Play notification sound
      playNotificationSound();

      // Show toast notification
      toast.success(
        `New message from ${senderName}`,
        {
          duration: 5000,
          icon: '💬',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        }
      );

      // Show desktop notification (if permission granted)
      if (showNotificationRef.current) {
        showNotificationRef.current(
          `New message from ${senderName}`,
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

      // Play notification sound
      playNotificationSound();

      // Show toast notification
      toast.success(
        `New bid from ${bidderName}`,
        {
          duration: 5000,
          icon: '📋',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        }
      );

      // Show desktop notification
      if (showNotificationRef.current) {
        showNotificationRef.current(
          `New Bid Received`,
          {
            body: `${bidderName} submitted a bid ${bidAmount ? `of ${bidAmount}` : ''} for ${jobTitle}`,
            tag: 'bid-notification',
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

      // Play notification sound
      playNotificationSound();

      // Show toast notification
      toast.success(
        `${contractorName} started work`,
        {
          duration: 5000,
          icon: '🔨',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        }
      );

      // Show desktop notification
      if (showNotificationRef.current) {
        showNotificationRef.current(
          `Work Started`,
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

      // Play notification sound
      playNotificationSound();

      // Show toast notification
      toast.success(
        `${contractorName} completed work`,
        {
          duration: 5000,
          icon: '✅',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        }
      );

      // Show desktop notification
      if (showNotificationRef.current) {
        showNotificationRef.current(
          `Work Completed`,
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

      // Play notification sound
      playNotificationSound();

      // Show toast notification with success styling
      toast.success(
        data.message || `Your bid for "${jobTitle}" has been approved!`,
        {
          duration: 8000,
          icon: '🎉',
          style: {
            borderRadius: '10px',
            background: '#059669',
            color: '#fff',
          },
        }
      );

      // Show desktop notification
      if (showNotificationRef.current) {
        showNotificationRef.current(
          `Bid Approved! 🎉`,
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

      // Play notification sound
      playNotificationSound();

      // Show toast notification with error styling
      toast(
        data.message || `Your bid for "${jobTitle}" was not selected.`,
        {
          duration: 8000,
          icon: '😔',
          style: {
            borderRadius: '10px',
            background: '#dc2626',
            color: '#fff',
          },
        }
      );

      // Show desktop notification
      if (showNotificationRef.current) {
        showNotificationRef.current(
          `Bid Update`,
          {
            body: data.message || `Your bid for ${jobTitle} was not selected.`,
            tag: 'bid-declined-notification',
            requireInteraction: false,
          }
        );
      }
    });

    setSocket(newSocket);

    return () => {
      console.log("🧹 Cleaning up socket connection...");
      newSocket.disconnect();
      setIsConnected(false);
    };
  }, [fetchNotifications]);

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
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
