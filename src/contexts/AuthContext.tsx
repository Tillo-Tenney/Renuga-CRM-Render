import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/data/mockData';
import { authApi } from '@/services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    // Check for existing session by validating token
    const validateSession = async () => {
      const token = localStorage.getItem('crm_token');
      if (token) {
        try {
          const response = await authApi.validateToken();
          if (response.valid && response.user) {
            setCurrentUser({
              id: response.user.id,
              name: response.user.name,
              email: response.user.email,
              role: response.user.role as User['role'],
              isActive: response.user.isActive,
            });
          }
        } catch (error) {
          // Token invalid, clear it
          localStorage.removeItem('crm_token');
          localStorage.removeItem('crm_user_id');
        }
      }
      setIsLoading(false);
    };

    validateSession();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authApi.login(email, password);
      
      if (response.success && response.user) {
        const user: User = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role as User['role'],
          isActive: response.user.isActive,
        };
        
        setCurrentUser(user);
        localStorage.setItem('crm_user_id', user.id);
        return { success: true };
      }
      
      return { success: false, error: 'Login failed' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setCurrentUser(null);
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
