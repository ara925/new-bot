// frontend/src/hooks/useCredits.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface CreditTransaction {
  _id: string;
  amount: number;
  type: string;
  feature?: string;
  description: string;
  createdAt: string;
}

interface CreditTransactionResponse {
  data: CreditTransaction[];
  pagination: {
    total: number;
    pages: number;
    currentPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const useCredits = () => {
  const { user, updateUser } = useAuth();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    currentPage: 1,
    hasNext: false,
    hasPrev: false
  });

  // Fetch credit transactions
  const fetchTransactions = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getCreditTransactions(page);
      setTransactions(response.data.data);
      setPagination(response.data.pagination);
    } catch (err: any) {
      console.error('Error fetching credit transactions:', err);
      setError(err.response?.data?.error || 'Failed to load credit transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh user's credits
  const refreshCredits = useCallback(async () => {
    try {
      const response = await api.getCredits();
      updateUser({
        credits: response.data.data.credits,
        reservedCredits: response.data.data.reservedCredits,
        subscriptionPlan: response.data.data.subscriptionPlan
      });
    } catch (err) {
      console.error('Error refreshing credits:', err);
    }
  }, [updateUser]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, fetchTransactions]);

  // Calculate credit statistics
  const creditStats = {
    available: user?.credits || 0,
    reserved: user?.reservedCredits || 0,
    total: (user?.credits || 0) + (user?.reservedCredits || 0),
    monthlyAllocation: user?.subscriptionPlan?.monthlyCredits || 0,
    
    // Totals for different transaction types
    usedThisMonth: transactions
      .filter(tx => 
        tx.type === 'usage' && 
        new Date(tx.createdAt).getMonth() === new Date().getMonth() &&
        new Date(tx.createdAt).getFullYear() === new Date().getFullYear()
      )
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
    
    usedTotal: transactions
      .filter(tx => tx.type === 'usage')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
    
    purchasedTotal: transactions
      .filter(tx => tx.type === 'purchase')
      .reduce((sum, tx) => sum + tx.amount, 0)
  };

  // Group transactions by feature
  const usageByFeature = transactions
    .filter(tx => tx.type === 'usage')
    .reduce((acc: Record<string, number>, tx) => {
      const feature = tx.feature || 'other';
      acc[feature] = (acc[feature] || 0) + Math.abs(tx.amount);
      return acc;
    }, {});

  return {
    transactions,
    loading,
    error,
    pagination,
    creditStats,
    usageByFeature,
    fetchTransactions,
    refreshCredits
  };
};

// frontend/src/hooks/usePlans.ts
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  discount: number;
  monthlyCredits: number;
  features: string[];
  popular?: boolean;
}

export const usePlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.getPlans();
        
        // Mark the Plus plan as popular by default
        const plansWithPopular = response.data.data.map((plan: Plan) => ({
          ...plan,
          popular: plan.id === 'plus'
        }));
        
        setPlans(plansWithPopular);
      } catch (err: any) {
        console.error('Error fetching plans:', err);
        setError(err.response?.data?.error || 'Failed to load plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  return {
    plans,
    loading,
    error
  };
};

// frontend/src/hooks/useSubscription.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

interface Subscription {
  type: string;
  monthlyCredits: number;
  isLifetime: boolean;
  purchasedAt: string;
  expiresAt?: string;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscription
  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getSubscription();
      setSubscription(response.data.data.subscription);
    } catch (err: any) {
      console.error('Error fetching subscription:', err);
      setError(err.response?.data?.error || 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Calculate subscription status
  const subscriptionStatus = subscription
    ? {
        isActive: subscription.isLifetime || 
          (subscription.expiresAt && new Date(subscription.expiresAt) > new Date()),
        isLifetime: subscription.isLifetime,
        daysRemaining: subscription.expiresAt 
          ? Math.max(0, Math.ceil((new Date(subscription.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : undefined,
        expiryDate: subscription.expiresAt,
        type: subscription.type
      }
    : null;

  return {
    subscription,
    subscriptionStatus,
    loading,
    error,
    refreshSubscription: fetchSubscription
  };
};
