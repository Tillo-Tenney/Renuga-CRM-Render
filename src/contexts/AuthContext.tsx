import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, mockUsers } from '@/data/mockData';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock credentials - In production, this would be handled by a backend
const MOCK_CREDENTIALS: Record<string, string> = {
  'priya@renuga.com': 'password123',
  'ravi@renuga.com': 'password123',
  'muthu@renuga.com': 'password123',
  'admin@renuga.com': 'admin123',
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUserId = localStorage.getItem('crm_user_id');
    if (storedUserId) {
      const user = mockUsers.find(u => u.id === storedUserId);
      if (user) {
        setCurrentUser(user);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (!user.isActive) {
      return { success: false, error: 'User account is inactive' };
    }

    const expectedPassword = MOCK_CREDENTIALS[user.email];
    if (password !== expectedPassword) {
      return { success: false, error: 'Invalid password' };
    }

    setCurrentUser(user);
    localStorage.setItem('crm_user_id', user.id);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('crm_user_id');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!currentUser,
        currentUser,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
