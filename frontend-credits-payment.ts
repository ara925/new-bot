// frontend/src/pages/credits/index.tsx
import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import PricingPlans from '../../components/credits/PricingPlans';
import CreditHistory from '../../components/credits/CreditHistory';
import CurrentPlan from '../../components/credits/CurrentPlan';
import {
  CreditCardIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationIcon
} from '@heroicons/react/outline';

const CreditsPage: React.FC = () => {
  const { user } = useAuth();
  const [creditHistory, setCreditHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load credit history
  useEffect(() => {
    const loadCreditHistory = async () => {
      try {
        const response = await api.getCreditTransactions();
        setCreditHistory(response.data.data);
      } catch (error) {
        console.error('Error loading credit history:', error);
        setError('Failed to load credit history');
      } finally {
        setLoading(false);
      }
    };

    loadCreditHistory();
  }, []);

  return (
    <MainLayout title="Credits & Billing | TextBuilder AI">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Credits & Billing</h2>
          <p className="text-gray-600">
            Manage your credits, subscription, and payment information
          </p>
        </div>

        {/* Success or error messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={() => setSuccessMessage(null)}
                    className="inline-flex rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current plan and credits overview */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-2">
                <CurrentPlan user={user} />
              </div>
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-blue-800 mb-4">Credits Available</h3>
                <div className="flex items-end">
                  <span className="text-4xl font-bold text-blue-900">{user?.credits.toLocaleString()}</span>
                  <span className="ml-2 text-sm text-blue-700">credits</span>
                </div>
                <p className="mt-2 text-sm text-blue-700">
                  Your credits can be used to generate content with AI tools
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('plans')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <CreditCardIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Get More Credits
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('plans')}
                className={`${
                  activeTab === 'plans'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center`}
              >
                <CreditCardIcon
                  className={`mr-2 h-5 w-5 ${
                    activeTab === 'plans' ? 'text-blue-500' : 'text-gray-400'
                  }`}
                  aria-hidden="true"
                />
                Pricing Plans
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center`}
              >
                <ClockIcon
                  className={`mr-2 h-5 w-5 ${
                    activeTab === 'history' ? 'text-blue-500' : 'text-gray-400'
                  }`}
                  aria-hidden="true"
                />
                Credit History
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'plans' ? (
              <PricingPlans
                currentPlan={user?.subscriptionPlan?.type}
                onSuccess={(message) => setSuccessMessage(message)}
                onError={(message) => setError(message)}
              />
            ) : (
              <CreditHistory
                transactions={creditHistory}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CreditsPage;

// frontend/src/components/credits/CurrentPlan.tsx
import React from 'react';
import { format } from 'date-fns';
import { ChipIcon, CheckIcon } from '@heroicons/react/outline';

interface CurrentPlanProps {
  user: any;
}

const CurrentPlan: React.FC<CurrentPlanProps> = ({ user }) => {
  if (!user || !user.subscriptionPlan) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500">No subscription plan available</p>
      </div>
    );
  }

  const { type, monthlyCredits, isLifetime, purchasedAt, expiresAt } = user.subscriptionPlan;

  // Format plan name
  const planName = type.charAt(0).toUpperCase() + type.slice(1);

  // Format dates
  const purchaseDate = purchasedAt ? format(new Date(purchasedAt), 'MMMM d, yyyy') : 'N/A';
  const expiryDate = expiresAt ? format(new Date(expiresAt), 'MMMM d, yyyy') : 'Never';

  // Get plan features
  const getPlanFeatures = () => {
    const commonFeatures = [
      'AI-generated articles',
      'Auto Writer for bulk generation',
      'Long-form Writer',
      'WordPress integration'
    ];

    const planSpecificFeatures = {
      pro: [
        '100,000 monthly credits',
        'Auto post to WordPress',
        'AI images included'
      ],
      plus: [
        '200,000 monthly credits',
        'Auto post to WordPress',
        'AI images included',
        'Priority support'
      ],
      platinum: [
        '300,000 monthly credits',
        'Auto post to WordPress',
        'AI images included',
        'Priority support',
        'Advanced AI models'
      ],
      agency: [
        '600,000 monthly credits',
        'Auto post to WordPress',
        'AI images included',
        'Priority support',
        'Advanced AI models',
        'Team collaboration'
      ]
    };

    return [...commonFeatures, ...(planSpecificFeatures[type as keyof typeof planSpecificFeatures] || [])];
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Current Plan: {planName}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {isLifetime ? 'Lifetime Access' : 'Monthly Subscription'}
          </p>
        </div>
        <div className="bg-blue-100 text-blue-800 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium">
          <ChipIcon className="mr-1 h-4 w-4" />
          {monthlyCredits.toLocaleString()} credits/month
        </div>
      </div>

      <div className="mt-5 border-t border-gray-200 pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Purchased on</span>
            <p className="font-medium">{purchaseDate}</p>
          </div>
          <div>
            <span className="text-gray-500">Expires</span>
            <p className="font-medium">{expiryDate}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-900">Plan includes:</h4>
        <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
          {getPlanFeatures().map((feature, index) => (
            <li key={index} className="flex items-start">
              <div className="flex-shrink-0">
                <CheckIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
              </div>
              <p className="ml-2 text-sm text-gray-500">{feature}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CurrentPlan;

// frontend/src/components/credits/PricingPlans.tsx
import React, { useState } from 'react';
import { api } from '../../utils/api';
import { CheckIcon, XIcon } from '@heroicons/react/outline';
import PaymentModal from './PaymentModal';

interface PricingPlansProps {
  currentPlan?: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

// Plan data
const plans = [
  {
    id: 'pro',
    name: 'Lifetime PRO',
    description: 'Perfect for bloggers and content creators',
    price: 99,
    originalPrice: 1404,
    discount: 93,
    monthlyCredits: 100000,
    features: [
      'Generate 100+ articles with 1-click',
      'AI Image Generation',
      'Auto Post to WordPress',
      'Long-form Writer',
      'AI Templates',
      'TOP 10 Listicle Builder',
      '1000+ ChatGPT prompts'
    ],
    popular: false
  },
  {
    id: 'plus',
    name: 'Lifetime PLUS',
    description: 'Best for professional bloggers',
    price: 179,
    originalPrice: 2124,
    discount: 92,
    monthlyCredits: 200000,
    features: [
      'Generate 100+ articles with 1-click',
      'AI Image Generation',
      'Auto Post to WordPress',
      'Long-form Writer',
      'AI Templates',
      'TOP 10 Listicle Builder',
      '1000+ ChatGPT prompts',
      'Priority Support'
    ],
    popular: true
  },
  {
    id: 'platinum',
    name: 'Lifetime PLATINUM',
    description: 'Advanced features for power users',
    price: 279,
    originalPrice: 2844,
    discount: 90,
    monthlyCredits: 300000,
    features: [
      'Generate 100+ articles with 1-click',
      'AI Image Generation',
      'Auto Post to WordPress',
      'Long-form Writer',
      'AI Templates',
      'TOP 10 Listicle Builder',
      '1000+ ChatGPT prompts',
      'Priority Support',
      'Advanced AI Models'
    ],
    popular: false
  },
  {
    id: 'agency',
    name: 'Lifetime AGENCY+',
    description: 'Maximum power for agencies and teams',
    price: 495,
    originalPrice: 6444,
    discount: 92,
    monthlyCredits: 600000,
    features: [
      'Generate 100+ articles with 1-click',
      'AI Image Generation',
      'Auto Post to WordPress',
      'Long-form Writer',
      'AI Templates',
      'TOP 10 Listicle Builder',
      '1000+ ChatGPT prompts',
      'Priority Support',
      'Advanced AI Models',
      'Team Collaboration',
      'White-label Reports'
    ],
    popular: false
  }
];

const PricingPlans: React.FC<PricingPlansProps> = ({ currentPlan, onSuccess, onError }) => {
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Handle plan selection
  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  // Handle subscription completion
  const handleSubscriptionComplete = async (paymentMethodId: string) => {
    if (!selectedPlan) return;
    
    setProcessing(true);
    
    try {
      // In a real implementation, this would call your backend API
      // const response = await api.createSubscription({
      //   planId: selectedPlan.id,
      //   paymentMethodId
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onSuccess(`Successfully subscribed to ${selectedPlan.name}!`);
      setShowPaymentModal(false);
      setSelectedPlan(null);
    } catch (error) {
      console.error('Error creating subscription:', error);
      onError('Failed to process payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <div>
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold text-gray-900">Choose Your Plan</h3>
          <p className="mt-2 text-lg text-gray-500">
            One-time payment. Lifetime access. No subscription fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.id;
            
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-lg overflow-hidden border ${
                  plan.popular
                    ? 'border-blue-500 ring-2 ring-blue-500 shadow-xl'
                    : 'border-gray-200 shadow'
                } flex flex-col`}
              >
                {plan.popular && (
                  <div className="bg-blue-500 text-white text-xs font-bold uppercase tracking-wide text-center py-1">
                    Most Popular
                  </div>
                )}
                <div className="p-6 flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                    <span className="ml-2 text-base font-medium text-gray-500 line-through">
                      ${plan.originalPrice}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-green-600 font-medium">
                    Save {plan.discount}%
                  </p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {plan.monthlyCredits.toLocaleString()} monthly credits
                    </span>
                  </div>
                  
                  <ul className="mt-6 space-y-4 text-sm text-gray-500">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <div className="flex-shrink-0">
                          <CheckIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                        </div>
                        <p className="ml-2">{feature}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 bg-gray-50 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrentPlan}
                    className={`w-full inline-flex justify-center items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm ${
                      isCurrentPlan
                        ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
                        : plan.popular
                        ? 'border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        : 'border-blue-600 text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                  >
                    {isCurrentPlan ? 'Current Plan' : 'Get Started'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <h3 className="text-lg font-medium text-gray-900">Satisfaction Guaranteed</h3>
          <p className="mt-2 text-md text-gray-500">
            30-day money-back guarantee. No questions asked.
          </p>
        </div>

        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Frequently Asked Questions</h3>

          <div className="space-y-6">
            <div>
              <h4 className="text-md font-medium text-gray-900">Is it really a single payment?</h4>
              <p className="mt-1 text-sm text-gray-500">
                Yes, this is a one-time payment for lifetime access. You won't have to pay anything extra. It is NOT a monthly payment or subscription fee.
              </p>
            </div>

            <div>
              <h4 className="text-md font-medium text-gray-900">What is a Credit?</h4>
              <p className="mt-1 text-sm text-gray-500">
                1 credit = 1 word. When you buy plans, you get a certain number of credits that you can use for generating content. Credits renew every month on the date the purchase was made.
              </p>
            </div>

            <div>
              <h4 className="text-md font-medium text-gray-900">Can I get more credits?</h4>
              <p className="mt-1 text-sm text-gray-500">
                Yes! You can buy additional credits at any time through the dashboard after purchasing a Lifetime plan.
              </p>
            </div>

            <div>
              <h4 className="text-md font-medium text-gray-900">How can I get a refund?</h4>
              <p className="mt-1 text-sm text-gray-500">
                We offer a "no questions asked" refund policy. Simply open a support ticket within 30 days of your purchase, and you will receive a refund immediately.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          onClose={() => setShowPaymentModal(false)}
          onComplete={handleSubscriptionComplete}
          processing={processing}
        />
      )}
    </>
  );
};

export default PricingPlans;

// frontend/src/components/credits/PaymentModal.tsx
import React, { useState } from 'react';
import { XIcon, CreditCardIcon, LockClosedIcon } from '@heroicons/react/outline';

interface PaymentModalProps {
  plan: any;
  onClose: () => void;
  onComplete: (paymentMethodId: string) => void;
  processing: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ plan, onClose, onComplete, processing }) => {
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!cardName.trim()) {
      setError('Please enter the name on card');
      return;
    }
    
    if (!cardNumber.trim() || cardNumber.replace(/\s/g, '').length !== 16) {
      setError('Please enter a valid card number');
      return;
    }
    
    if (!expiry.trim() || !/^\d{2}\/\d{2}$/.test(expiry)) {
      setError('Please enter a valid expiry date (MM/YY)');
      return;
    }
    
    if (!cvc.trim() || !/^\d{3,4}$/.test(cvc)) {
      setError('Please enter a valid CVC');
      return;
    }
    
    setError(null);
    
    // In a real implementation, this would use Stripe.js to tokenize the card
    // For now, we'll just pass a mock payment method ID
    const mockPaymentMethodId = 'pm_' + Math.random().toString(36).substring(2, 15);
    onComplete(mockPaymentMethodId);
  };

  // Format card number with spaces
  const formatCardNumber = (input: string) => {
    const cleaned = input.replace(/\D/g, '');
    const groups = [];
    
    for (let i = 0; i < cleaned.length; i += 4) {
      groups.push(cleaned.substring(i, i + 4));
    }
    
    return groups.join(' ').trim().substring(0, 19);
  };

  // Format expiry date
  const formatExpiry = (input: string) => {
    const cleaned = input.replace(/\D/g, '');
    
    if (cleaned.length <= 2) {
      return cleaned;
    }
    
    return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="sr-only">Close</span>
              <XIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div>
            <div className="text-center sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Complete Your Purchase
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You're purchasing {plan.name} for ${plan.price}
              </p>
            </div>
            
            <div className="mt-4 bg-blue-50 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <LockClosedIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Demo mode: No real payment will be processed.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <XIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="card-name" className="block text-sm font-medium text-gray-700">
                  Name on card
                </label>
                <input
                  type="text"
                  id="card-name"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="John Smith"
                  disabled={processing}
                />
              </div>

              <div>
                <label htmlFor="card-number" className="block text-sm font-medium text-gray-700">
                  Card number
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCardIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    id="card-number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                    disabled={processing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expiry" className="block text-sm font-medium text-gray-700">
                    Expiration date
                  </label>
                  <input
                    type="text"
                    id="expiry"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="MM/YY"
                    maxLength={5}
                    disabled={processing}
                  />
                </div>
                <div>
                  <label htmlFor="cvc" className="block text-sm font-medium text-gray-700">
                    CVC
                  </label>
                  <input
                    type="text"
                    id="cvc"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').substring(0, 4))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="123"
                    maxLength={4}
                    disabled={processing}
                  />
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    `Pay $${plan.price}`
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Secure payment processing. By proceeding, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;

// frontend/src/components/credits/CreditHistory.tsx
import React from 'react';
import { format } from 'date-fns';

interface CreditHistoryProps {
  transactions: any[];
  loading: boolean;
}

const CreditHistory: React.FC<CreditHistoryProps> = ({ transactions, loading }) => {
  // Format transaction type for display
  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'Purchase';
      case 'usage':
        return 'Usage';
      case 'subscription_renewal':
        return 'Subscription Renewal';
      case 'adjustment':
        return 'Adjustment';
      case 'refund':
        return 'Refund';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Format feature for display
  const formatFeature = (feature: string) => {
    switch (feature) {
      case 'ai_writer':
        return 'AI Writer';
      case 'auto_writer':
        return 'Auto Writer';
      case 'long_form_writer':
        return 'Long-form Writer';
      case 'image_generation':
        return 'Image Generation';
      default:
        return feature?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="py-6 text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Loading transaction history...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500">No credit transactions found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Feature
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Credits
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <tr key={transaction._id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {format(new Date(transaction.createdAt), 'MMM d, yyyy')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  transaction.type === 'purchase' || transaction.type === 'subscription_renewal'
                    ? 'bg-green-100 text-green-800'
                    : transaction.type === 'usage'
                    ? 'bg-blue-100 text-blue-800'
                    : transaction.type === 'refund'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {formatTransactionType(transaction.type)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatFeature(transaction.feature)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {transaction.description}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CreditHistory;
