// Browser Native Notification Helper with graceful fallbacks
export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getBrowserNotificationPermission(): NotificationPermission {
  if (!isBrowserNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (!isBrowserNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

export function sendBrowserNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    requireInteraction?: boolean;
    data?: any;
    onClick?: () => void;
  }
): Notification | null {
  if (!isBrowserNotificationSupported()) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    const notification = new Notification(title, {
      body: options?.body,
      icon: options?.icon || 'https://fav.farm/📈',
      tag: options?.tag || `trade-alert-${Date.now()}`,
      requireInteraction: options?.requireInteraction ?? true,
      data: options?.data,
    });

    notification.onclick = () => {
      window.focus();
      options?.onClick?.();
      notification.close();
    };

    return notification;
  } catch (e) {
    console.warn('Browser notification failed:', e);
    return null;
  }
}
