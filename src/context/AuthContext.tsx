import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  address?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  setAuthState: (token: string, user: User) => void;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      console.log('🔄 Initial auth check - fetching user with token');
      fetchUser(storedToken);
    } else {
      console.log('ℹ️ No token found in localStorage');
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - fetchUser is defined inside this component

  const fetchUser = async (authToken: string) => {
    console.log('🔄 fetchUser called with token:', authToken ? authToken.substring(0, 20) + '...' : 'NONE');
    try {
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      console.log('✅ /auth/me response received:', response.data);
      
      if (response.data?.user) {
        const userData = response.data.user;
        console.log('🔄 User data from /auth/me - Role:', userData.role, 'Email:', userData.email);
        
        // CRITICAL: Patient portal should ONLY accept users with role='patient'
        if (userData.role === 'patient') {
          setUser(userData);
          setToken(authToken); // Ensure token is set
          console.log('✅ Patient authenticated via fetchUser:', userData.email);
        } else {
          // User is not a patient - clear the token and session
          console.warn(`❌ User ${userData.email} has role '${userData.role}' - not allowed in patient portal. Clearing session.`);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } else {
        // Invalid response - clear everything
        console.error('❌ Invalid response from /auth/me - no user data:', response.data);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch user from /auth/me');
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      console.error('❌ Error message:', error.message);
      
      // Only clear token on 401 (unauthorized) - other errors might be temporary
      if (error.response?.status === 401) {
        console.warn('❌ 401 Unauthorized in fetchUser - clearing token');
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } else {
        // For other errors (network, timeout, etc.), keep the token but log the error
        console.warn('⚠️ Non-401 error in fetchUser - keeping token but not setting user');
        console.warn('⚠️ This might be a network issue - token will be kept for retry');
      }
    } finally {
      setIsLoading(false);
      console.log('🔄 fetchUser completed, isLoading set to false');
    }
  };

  const login = async (email: string, password: string) => {
    console.log('🔐 Starting login for:', email);
    const response = await api.post('/auth/login', { email, password });
    const { token: authToken, user: userData } = response.data;
    
    console.log('🔐 Login response received - Role:', userData.role, 'User ID:', userData.id);
    
    // CRITICAL: Patient portal should ONLY allow login for patients
    if (userData.role !== 'patient') {
      console.warn(`❌ User ${userData.email} has role '${userData.role}' - not allowed to login to patient portal.`);
      throw new Error('Only patients can login to this portal. Please use the appropriate portal for your role.');
    }
    
    // Store token first
    localStorage.setItem('token', authToken);
    console.log('🔐 Token stored in localStorage');
    
    // Then update state immediately
    setToken(authToken);
    setUser(userData);
    setIsLoading(false); // Ensure loading is false after login
    
    console.log('✅ Patient login successful:', userData.email, 'Role:', userData.role);
    console.log('✅ Auth state - Token:', !!authToken, 'User:', userData.email);
  };

  // Helper to update auth state directly (for registration auto-login)
  const setAuthState = (authToken: string, userData: User) => {
    // CRITICAL: Patient portal should ONLY accept patients
    if (userData.role !== 'patient') {
      console.warn(`User ${userData.email} has role '${userData.role}' - not allowed in patient portal.`);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      return;
    }
    
    localStorage.setItem('token', authToken);
    setToken(authToken);
    setUser(userData);
  };

  const register = async (data: RegisterData) => {
    const response = await api.post('/auth/register', {
      user: { ...data, role: 'patient' },
    });
    const { token: authToken, user: userData } = response.data;
    setToken(authToken);
    setUser(userData);
    localStorage.setItem('token', authToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  // Debug: Log auth state changes
  useEffect(() => {
    if (!isLoading) {
      const storedToken = localStorage.getItem('token');
      console.log('🔐 Auth state updated - User:', user?.email || 'null', 'Role:', user?.role || 'N/A');
      console.log('🔐 Auth state - Context token:', !!token, 'LocalStorage token:', !!storedToken);
      if (user && !token) {
        console.warn('⚠️ User exists but token is null in context!');
      }
      if (token && !user) {
        console.warn('⚠️ Token exists but user is null - might be loading or validation issue');
      }
    }
  }, [user, token, isLoading]);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading, setAuthState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

