import React from 'react';
import Notification, { NotificationType } from './Notification';

export interface NotificationItem {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

interface NotificationContainerProps {
  notifications: NotificationItem[];
  onRemove: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onRemove,
}) => {
  // Calculate bottom position for each notification to stack them
  const getBottomPosition = (index: number) => {
    // Each notification is approximately 80px tall + 16px spacing
    const notificationHeight = 96;
    return 16 + index * notificationHeight;
  };

  return (
    <>
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            position: 'fixed',
            bottom: `${getBottomPosition(notifications.length - 1 - index)}px`,
            right: '1rem',
            zIndex: 50 + index,
            maxWidth: '28rem',
            width: '100%',
          }}
        >
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => onRemove(notification.id)}
            duration={notification.duration}
          />
        </div>
      ))}
    </>
  );
};

export default NotificationContainer;

