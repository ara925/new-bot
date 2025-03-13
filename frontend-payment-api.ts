// frontend/src/utils/payment-api.ts
import { apiClient } from './api';

// Payment API functions
export const paymentApi = {
  // Get available plans
  getPlans: () => 
    apiClient.get('/payment/plans'),
  
  // Get user's subscription
  getSubscription: () => 
    apiClient.get('/payment/subscription'),
  
  // Create payment intent
  createPaymentIntent: (planId: string, isLifetime: boolean = true) => 
    apiClient.post('/payment/create-payment-intent', { planId, isLifetime }),
  
  // Process payment
  processPayment: (planId: string, paymentMethodId: string, isLifetime: boolean = true) => 
    apiClient.post('/payment/process-payment', { planId, paymentMethodId, isLifetime }),
  
  // Buy additional credits
  buyCredits: (creditAmount: 'small' | 'medium' | 'large', paymentMethodId: string) => 
    apiClient.post('/payment/buy-credits', { creditAmount, paymentMethodId })
};

// Add to main API export
import { api } from './api';

// Extend the existing API with payment functions
export const extendedApi = {
  ...api,
  ...paymentApi
};

// Replace the original export
export { extendedApi as api };
