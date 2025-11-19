import { useEffect, useState } from 'react';

export const useNotifications = () => {
  // Check if Notification API is supported (not available on iOS Safari)
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;
  const [permission, setPermission] = useState(isSupported ? Notification.permission : 'denied');

  useEffect(() => {
    // Update permission state if it changes (only if supported)
    if (isSupported) {
      setPermission(Notification.permission);
    }
  }, [isSupported]);

  // Request notification permission
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }

    return Notification.permission;
  };

  // Show a desktop notification
  const showNotification = (title, options = {}) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/logo.png', // Add your app icon path
        badge: '/logo.png',
        ...options,
      });

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      return notification;
    } else {
      console.log('Notification permission not granted');
      return null;
    }
  };

  return {
    permission,
    requestPermission,
    showNotification,
  };
};
