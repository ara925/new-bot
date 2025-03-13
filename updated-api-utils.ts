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
  
  deleteMultipleArticles: (ids: string[]) => 
    apiClient.delete('/articles', { data: { ids } }),
  
  publishArticle: (id: string, data: any) => 
    apiClient.post(`/articles/${id}/publish`, data),
  
  exportArticle: (id: string, format: string = 'html') => 
    apiClient.get(`/articles/${id}/export`, { params: { format } }),
  
  // Generation
  generateTitles: (topic: string, count: number = 20) => 
    apiClient.post('/generate/titles', { topic, count }),
  
  startBulkGeneration: (titles: string[], config: any) => 
    apiClient.post('/generate/bulk', { titles, config }),
  
  generateSingleArticle: (title: string, config: any) => 
    apiClient.post('/generate/article', { title, config }),
  
  getJobStatus: (jobId: string) => 
    apiClient.get(`/generate/status/${jobId}`),
  
  getUserJobs: (page: number = 1, limit: number = 10) => 
    apiClient.get('/generate/jobs', { params: { page, limit } }),
  
  cancelJob: (jobId: string) => 
    apiClient.delete(`/generate/jobs/${jobId}`),
  
  // WordPress
  getWordPressSites: () => 
    apiClient.get('/wordpress/sites'),
  
  getWordPressSite: (id: string) => 
    apiClient.get(`/wordpress/sites/${id}`),
  
  addWordPressSite: (data: any) => 
    apiClient.post('/wordpress/sites', data),
  
  updateWordPressSite: (id: string, data: any) => 
    apiClient.put(`/wordpress/sites/${id}`, data),
  
  deleteWordPressSite: (id: string) => 
    apiClient.delete(`/wordpress/sites/${id}`),
  
  validateWordPressSite: (data: any) => 
    apiClient.post('/wordpress/validate', data),
  
  getWordPressCategories: (siteId: string) => 
    apiClient.get(`/wordpress/sites/${siteId}/categories`),
  
  getWordPressTags: (siteId: string, search?: string) => 
    apiClient.get(`/wordpress/sites/${siteId}/tags`, { params: { search } }),
  
  // Credits
  getCredits: () => 
    apiClient.get('/auth/credits'),
  
  getCreditTransactions: (page: number = 1, limit: number = 10) => 
    apiClient.get('/auth/credits/transactions', { params: { page, limit } }),
    
  // Image Generation - New functionality
  generateImages: (options: { prompt: string, style?: string, numberOfImages?: number }) => 
    apiClient.post('/images/generate', options),
    
  getImageEstimate: (numberOfImages: number = 1) => 
    apiClient.get('/images/estimate', { params: { numberOfImages } })
};
