
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type NotificationType = 'gold' | 'red' | 'info' | 'success' | 'error';

interface Notification {
  text: string;
  type: NotificationType;
  id: number;
}

interface NotificationContextType {
  showNotification: (text: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((text: string, type: NotificationType) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { text, type, id }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`
                px-6 py-3 rounded-md font-medium uppercase tracking-wider text-white shadow-xl pointer-events-auto
                ${notif.type === 'gold' ? 'bg-[#D4AF37]' : notif.type === 'success' ? 'bg-[#16a34a]' : notif.type === 'info' ? 'bg-[#2563eb]' : 'bg-[#ff4444]'}
              `}
            >
              {notif.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
