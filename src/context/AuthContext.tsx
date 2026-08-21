import React, { createContext, useContext, useState, useEffect } from 'react';
import { sendNotificationToUser } from '../utils/push';

interface User {
  email: string;
  name?: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, code: string, verificationToken: string, name?: string) => Promise<void>;
  sendCode: (email: string) => Promise<{ verificationToken: string }>;
  logout: () => void;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  requireAuth: (callback: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user');
    let currentUser: User | null = null;
    
    if (savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
        setUser(currentUser);
      } catch (e) {
        // ignore
      }
    }
    setIsLoading(false);

    // If user is initialized and notification is already granted, ensure we are subscribed and DB is in sync.
    if (currentUser?.email && 'Notification' in window && Notification.permission === 'granted') {
      import('../utils/push').then(({ subscribeToPush, savePushSubscription }) => {
        // We pass forceRenew=true initially to make sure any old webPush subscriptions with old VAPIDs get wiped out.
        // It will generate a new subscription object for this current browser device.
        const needsRenew = localStorage.getItem('push_renew_v1') !== 'true';
        subscribeToPush(needsRenew).then(subscription => {
          if (subscription) {
            savePushSubscription(subscription, currentUser!.email).catch(console.error);
            if (needsRenew) localStorage.setItem('push_renew_v1', 'true');
          }
        }).catch(console.error);
      });
    }
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const requireAuth = (callback: () => void) => {
    if (user) {
      callback();
    } else {
      openAuthModal();
    }
  };

  const sendCode = async (email: string) => {
    const res = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const contentType = res.headers.get("content-type");
    if (!contentType || contentType.indexOf("application/json") === -1) {
      throw new Error(`Server error. Please try again.`);
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send code');
    
    // Notify existing devices that a code was sent
    sendNotificationToUser(email, 'Login Code Requested', 'A verification code was just sent to your email.', '/').catch(err => console.error(err));
    
    return data;
  };

  const login = async (email: string, code: string, verificationToken: string, name?: string) => {
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, verificationToken, name }) // passing name if available
    });
    
    const contentType = res.headers.get("content-type");
    if (!contentType || contentType.indexOf("application/json") === -1) {
      throw new Error(`Server error. Please try again.`);
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invalid code');

    const newUser = { email, name: data.user?.name || name, token: data.token };
    setUser(newUser);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    closeAuthModal();

    // Notify other devices about the new login
    setTimeout(() => {
      sendNotificationToUser(email, 'Security Alert', 'A new device logged into your account. If this was you, you can ignore this.', '/').catch(console.error);
    }, 2000);
  };

  const logout = () => {
    if (user?.email) {
      sendNotificationToUser(user.email, 'Logged Out', 'You have successfully logged out of a device.', '/').catch(console.error);
    }
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, sendCode, logout, isLoading, isAuthModalOpen, openAuthModal, closeAuthModal, requireAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
