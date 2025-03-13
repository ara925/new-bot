// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { getCookie, setCookie, deleteCookie } from '../utils/cookies';

// Define user type
interface User {
  id: string;
  name: string;
  email: string;
  credits: number;
  subscriptionPlan: {
    type: string;
    monthlyCredits: number;
    isLifetime: boolean;
    purchasedAt: string;
    expiresAt?: string;
  };
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updateUser: (data: Partial<User>) => void;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API URLs
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Initialize auth state
  useEffect(() => {
    const loadUserFromToken = async () => {
      try {
        // Check if token exists
        const token = getCookie('token');
        
        if (!token) {
          setLoading(false);
          return;
        }

        // Set default auth header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Get user data
        const res = await axios.get(`${API_URL}/auth/me`);
        
        setUser(res.data.data);
        setLoading(false);
      } catch (err) {
        // Clear invalid token
        deleteCookie('token');
        axios.defaults.headers.common['Authorization'] = '';
        setUser(null);
        setLoading(false);
      }
    };

    loadUserFromToken();
  }, []);

  // Login user
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      
      // Set token and auth header
      const { token } = res.data;
      setCookie('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Get user data
      const userRes = await axios.get(`${API_URL}/auth/me`);
      setUser(userRes.data.data);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Register user
  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.post(`${API_URL}/auth/register`, { name, email, password });
      
      // Set token and auth header
      const { token } = res.data;
      setCookie('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Get user data
      const userRes = await axios.get(`${API_URL}/auth/me`);
      setUser(userRes.data.data);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    // Clear token and auth header
    deleteCookie('token');
    axios.defaults.headers.common['Authorization'] = '';
    
    // Clear user data
    setUser(null);
    
    // Redirect to login
    router.push('/login');
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Update user data
  const updateUser = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Auth context hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// frontend/src/utils/cookies.ts
/**
 * Get cookie by name
 */
export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }
  
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    
    if (cookie.startsWith(name + '=')) {
      return cookie.substring(name.length + 1);
    }
  }
  
  return null;
};

/**
 * Set cookie
 */
export const setCookie = (name: string, value: string, days = 30): void => {
  if (typeof document === 'undefined') {
    return;
  }
  
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);
  
  document.cookie = `${name}=${value};expires=${expirationDate.toUTCString()};path=/`;
};

/**
 * Delete cookie
 */
export const deleteCookie = (name: string): void => {
  if (typeof document === 'undefined') {
    return;
  }
  
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/`;
};

// frontend/src/utils/api.ts
import axios from 'axios';
import { getCookie } from './cookies';

// API base URL
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = getCookie('token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors (unauthorized)
    if (error.response && error.response.status === 401) {
      // If not on login or register page, redirect to login
      if (typeof window !== 'undefined' && 
          !window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// API helper functions
export const api = {
  // Auth
  login: (email: string, password: string) => 
    apiClient.post('/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string) => 
    apiClient.post('/auth/register', { name, email, password }),
  
  getProfile: () => 
    apiClient.get('/auth/me'),
  
  updateProfile: (data: any) => 
    apiClient.put('/auth/me', data),
  
  // Articles
  getArticles: (page: number = 1, limit: number = 10, filters = {}) => 
    apiClient.get('/articles', { params: { page, limit, ...filters } }),
  
  getArticle: (id: string) => 
    apiClient.get(`/articles/${id}`),
  
  updateArticle: (id: string, data: any) => 
    apiClient.put(`/articles/${id}`, data),
  
  deleteArticle: (id: string) => 
    apiClient.delete(`/articles/${id}`),
  
  // Generation
  generateTitles: (topic: string, count: number = 20) => 
    apiClient.post('/generate/titles', { topic, count }),
  
  startBulkGeneration: (titles: string[], config: any) => 
    apiClient.post('/generate/bulk', { titles, config }),
  
  generateSingleArticle: (title: string, config: any) => 
    apiClient.post('/generate/article', { title, config }),
  
  getJobStatus: (jobId: string) => 
    apiClient.get(`/generate/status/${jobId}`),
  
  // WordPress
  getWordPressSites: () => 
    apiClient.get('/wordpress/sites'),
  
  addWordPressSite: (data: any) => 
    apiClient.post('/wordpress/sites', data),
  
  validateWordPressSite: (data: any) => 
    apiClient.post('/wordpress/validate', data),
  
  // Credits
  getCredits: () => 
    apiClient.get('/auth/credits'),
  
  getCreditTransactions: (page: number = 1, limit: number = 10) => 
    apiClient.get('/auth/credits/transactions', { params: { page, limit } }),
};
