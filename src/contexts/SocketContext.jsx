// ============================================
// FIXED SocketContext.jsx
// Properly exports socket object to components
// ============================================

import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  // Return the socket directly (not an object containing it)
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      console.log('⚠️ No token found, socket connection skipped');
      return;
    }

    // Initialize Socket.io connection
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection successful
    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
    });

    // Connection error
    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
    });

    // Disconnection
    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    // Set the socket in state
    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Disconnecting socket...');
      newSocket.disconnect();
    };
  }, []);

  // CRITICAL: Return the socket directly, not { socket }
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;