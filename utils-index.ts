// Frontend utility exports
// This file re-exports utility functions and constants

// API utilities
export { api, apiClient, API_URL } from './api';

// Cookie utilities
export { getCookie, setCookie, deleteCookie } from './cookies';

// Date formatting
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Credit calculation helpers
export const calculateArticleCredits = (config: any): number => {
  let baseCredits = 0;
  
  // Base credits by length
  switch (config.length) {
    case 'short':
      baseCredits = 800;
      break;
    case 'medium':
      baseCredits = 1500;
      break;
    case 'long':
      baseCredits = 2500;
      break;
    default:
      baseCredits = 1500;
  }
  
  // Add credits for additional features
  if (config.generateImages) {
    baseCredits += config.imageCount * 50; // 50 credits per image
  }
  
  if (config.takeaways) {
    baseCredits += config.takeaways * 10; // 10 credits per takeaway
  }
  
  if (config.faqItems) {
    baseCredits += config.faqItems * 20; // 20 credits per FAQ item
  }
  
  // Add a buffer for other processing
  const buffer = baseCredits * 0.1;
  
  return Math.ceil(baseCredits + buffer);
};

// Text/content helpers
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const countWords = (text: string): number => {
  return text.split(/\s+/).filter(Boolean).length;
};

// Object helpers
export const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

// Error handling
export const getErrorMessage = (error: any): string => {
  return error.response?.data?.error || error.message || 'An error occurred';
};
