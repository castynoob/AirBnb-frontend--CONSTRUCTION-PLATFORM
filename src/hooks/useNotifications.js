import { useEffect, useState } from 'react';

export const useNotifications = () => {
  const [permission, setPermission] = useState(Notification.permission);

  useEffect(() => {
    // Update permission state if it changes
    setPermission(Notification.permission);
  }, []);

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
