// ============================================
// UPDATED SocketContext.jsx
// Avoids crashing when no userProfile/token
// ============================================

import { createContext, useContext, useEffect, useState } from "react";
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
  const { showNotification, requestPermission } = useNotifications();

  // Request notification permission on mount
  useEffect(() => {
    requestPermission();
  }, []);

  useEffect(() => {
    const userProfile = localStorage.getItem("userProfile");

    // ✅ Skip socket setup if no profile or no token
    if (!userProfile) {
      console.log("🚫 No userProfile found — socket not initialized");
      return;
    }

    const user = JSON.parse(userProfile);
    const token = user?.token;

    if (!token) {
      console.log("⚠️ No token found — socket not initialized");
      return;
    }

    // ✅ Initialize Socket.io connection
    const newSocket = io(import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5000", {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
    });

    // Listen for message notifications
    newSocket.on("message_notification", (data) => {
      console.log("📬 New message notification:", data);

      const senderName = data.senderName || 'Someone';
      const messagePreview = data.content ? data.content.substring(0, 50) + (data.content.length > 50 ? '...' : '') : 'New message';

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
      showNotification(
        `New message from ${senderName}`,
        {
          body: messagePreview,
          tag: 'message-notification',
          requireInteraction: false,
        }
      );
    });

    setSocket(newSocket);

    return () => {
      console.log("🧹 Cleaning up socket connection...");
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
