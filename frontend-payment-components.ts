// frontend/src/components/credits/CheckoutForm.tsx
import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { api } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

interface CheckoutFormProps {
  planId: string;
  onSuccess: (result: any) => void;
  onError: (error: string) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ planId, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { updateUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    const createPaymentIntent = async () => {
      try {
        const response = await api.createPaymentIntent(planId, true);
        setClientSecret(response.data.data.clientSecret);
      } catch (error: any) {
        onError(error.response?.data?.error || 'Failed to initialize payment');
      }
    };

    createPaymentIntent();
  }, [planId, onError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setLoading(true);

    try {
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        onError(error.message || 'Payment failed');
      } else if (paymentIntent.status === 'succeeded') {
        // Payment succeeded, process the subscription
        const response = await api.processPayment(planId, paymentIntent.payment_method as string);
        
        // Update user context with new subscription and credits
        updateUser({
          subscriptionPlan: response.data.data.subscription,
          credits: response.data.data.credits
        });
        
        onSuccess(response.data.data);
      } else {
        onError('Payment processing failed');
      }
    } catch (error: any) {
      onError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-md">
        <label htmlFor="card-element" className="block text-sm font-medium text-gray-700 mb-2">
          Credit or debit card
        </label>
        <div className="p-3 border border-gray-300 rounded-md bg-white">
          <CardElement
            id="card-element"
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>
      
      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          'Complete Payment'
        )}
      </button>
    </form>
  );
};

export default CheckoutForm;

// frontend/src/components/credits/StripeWrapper.tsx
import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface StripeWrapperProps {
  planId: string;
  onSuccess: (result: any) => void;
  onError: (error: string) => void;
}

const StripeWrapper: React.FC<StripeWrapperProps> = ({ planId, onSuccess, onError }) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm planId={planId} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
};

export default StripeWrapper;

// frontend/src/components/credits/BuyCreditsModal.tsx
import React, { useState } from 'react';
import { XIcon, LightningBoltIcon } from '@heroicons/react/outline';
import StripeWrapper from './StripeWrapper';
import { useAuth } from '../../contexts/AuthContext';

interface BuyCreditsModalProps {
  onClose: () => void;
  onSuccess: (result: any) => void;
}

const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'select' | 'payment'>('select');
  
  // Credit packages
  const creditPackages = [
    { id: 'small', amount: 10000, price: 9.99, label: '10,000 Credits' },
    { id: 'medium', amount: 50000, price: 39.99, label: '50,000 Credits' },
    { id: 'large', amount: 100000, price: 69.99, label: '100,000 Credits' }
  ];
  
  const handleSelectPackage = (packageId: string) => {
    setSelectedPackage(packageId);
  };
  
  const handleProceedToPayment = () => {
    if (!selectedPackage) {
      setError('Please select a credit package');
      return;
    }
    
    setCheckoutStep('payment');
  };
  
  const handlePaymentSuccess = (result: any) => {
    onSuccess({
      ...result,
      message: `Successfully purchased credits!`
    });
    onClose();
  };
  
  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setCheckoutStep('select');
  };
  
  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <XIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div>
            <div className="text-center sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {checkoutStep === 'select' ? 'Buy Additional Credits' : 'Complete Purchase'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {checkoutStep === 'select' 
                  ? 'Select a credit package to add more credits to your account' 
                  : 'Enter your payment details to complete the purchase'}
              </p>
            </div>
            
            {error && (
              <div className="mt-4 bg-red-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <XIcon className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {checkoutStep === 'select' ? (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {creditPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => handleSelectPackage(pkg.id)}
                      className={`border rounded-lg p-4 cursor-pointer ${
                        selectedPackage === pkg.id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="bg-blue-100 rounded-full p-2 mr-3">
                            <LightningBoltIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{pkg.label}</h4>
                            <p className="text-sm text-gray-500">Best value for small projects</p>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-gray-900">${pkg.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end space-x-3 pt-5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    disabled={!selectedPackage}
                    className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <StripeWrapper
                  planId={selectedPackage as string}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
                
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('select')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Back to package selection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};