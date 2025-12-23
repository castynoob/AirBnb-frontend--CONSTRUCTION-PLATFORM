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
  const { showNotification, requestPermission } = useNotifications();

  // Use refs to avoid stale closures in socket listeners
  const showNotificationRef = useRef(showNotification);
  useEffect(() => {
    showNotificationRef.current = showNotification;
  }, [showNotification]);

  // Request notification permission on mount
  useEffect(() => {
    requestPermission();
  }, []);

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

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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
      console.log("�� No userProfile found — socket not initialized");
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const user = JSON.parse(userProfile);
    const token = user?.token;

    if (!token) {
      console.log("⚠️ No token found — socket not initialized");
      setSocket(null);
      setIsConnected(false);
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
      console.log("📋 New bid notification:", data);

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

    setSocket(newSocket);

    return () => {
      console.log("🧹 Cleaning up socket connection...");
      newSocket.disconnect();
      setIsConnected(false);
    };
  }, []);

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
