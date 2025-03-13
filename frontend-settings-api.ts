// frontend/src/utils/settings-api.ts
import { apiClient } from './api';

// Settings API functions
export const settingsApi = {
  // User preferences
  getUserPreferences: () => 
    apiClient.get('/settings/preferences'),
  
  updateUserPreferences: (preferences: any) => 
    apiClient.put('/settings/preferences', { preferences }),
  
  // API keys
  getUserApiKeys: () => 
    apiClient.get('/settings/api-keys'),
  
  generateApiKey: (name: string) => 
    apiClient.post('/settings/api-keys', { name }),
  
  deleteApiKey: (id: string) => 
    apiClient.delete(`/settings/api-keys/${id}`),
  
  // Notification settings
  getNotificationSettings: () => 
    apiClient.get('/settings/notifications'),
  
  updateNotificationSettings: (notificationSettings: any) => 
    apiClient.put('/settings/notifications', { notificationSettings })
};

// Add to main API export
import { api } from './api';

// Extend the existing API with settings functions
export const extendedApi = {
  ...api,
  ...settingsApi
};

// Replace the original export
export { extendedApi as api };
