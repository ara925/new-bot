// backend/src/controllers/payment.ts
import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { asyncHandler, createError } from '../middleware/error';
import { paymentProcessor } from '../services/payment/processor';
import User, { SubscriptionPlanType } from '../models/User';
import { createLogger } from '../utils/logger';

const logger = createLogger('payment-controller');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15',
});

/**
 * Create a payment intent for purchasing credits
 * @route POST /api/payment/create-payment-intent
 * @access Private
 */
export const createPaymentIntent = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { planId, isLifetime = true } = req.body;
  
  if (!planId) {
    return next(createError('Plan ID is required', 400));
  }
  
  if (!Object.values(SubscriptionPlanType).includes(planId as SubscriptionPlanType)) {
    return next(createError('Invalid plan ID', 400));
  }
  
  try {
    // Get plan details
    const planDetails = getPlanDetails(planId as SubscriptionPlanType);
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: planDetails.price * 100, // Convert to cents
      currency: 'usd',
      metadata: {
        userId: req.user!.id,
        planId,
        isLifetime: String(isLifetime)
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret
      }
    });
  } catch (error) {
    logger.error('Error creating payment intent:', error);
    return next(createError('Payment processing error', 500));
  }
});

/**
 * Process a payment for a subscription
 * @route POST /api/payment/process-payment
 * @access Private
 */
export const processPayment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { planId, paymentMethodId, isLifetime = true } = req.body;
  
  if (!planId || !paymentMethodId) {
    return next(createError('Plan ID and payment method ID are required', 400));
  }
  
  if (!Object.values(SubscriptionPlanType).includes(planId as SubscriptionPlanType)) {
    return next(createError('Invalid plan ID', 400));
  }
  
  try {
    const result = await paymentProcessor.processPayment({
      userId: req.user!.id,
      planId: planId as SubscriptionPlanType,
      paymentMethodId,
      isLifetime
    });
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error processing payment:', error);
    return next(createError('Payment processing error', 500));
  }
});

/**
 * Handle Stripe webhook events
 * @route POST /api/payment/webhook
 * @access Public
 */
export const webhook = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const sig = req.headers['stripe-signature'] as string;
  
  if (!sig) {
    return next(createError('Stripe signature is missing', 400));
  }
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
    
    await paymentProcessor.handleWebhookEvent(event);
    
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Webhook error:', error);
    return next(createError('Webhook processing error', 400));
  }
});

/**
 * Get available plans
 * @route GET /api/payment/plans
 * @access Private
 */
export const getPlans = asyncHandler(async (req: Request, res: Response) => {
  const plans = [
    {
      id: SubscriptionPlanType.PRO,
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
      ]
    },
    {
      id: SubscriptionPlanType.PLUS,
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
      ]
    },
    {
      id: SubscriptionPlanType.PLATINUM,
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
      ]
    },
    {
      id: SubscriptionPlanType.AGENCY,
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
      ]
    }
  ];
  
  res.status(200).json({
    success: true,
    data: plans
  });
});

/**
 * Get user's subscription status
 * @route GET /api/payment/subscription
 * @access Private
 */
export const getSubscription = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.id);
    
    if (!user) {
      return next(createError('User not found', 404));
    }
    
    res.status(200).json({
      success: true,
      data: {
        subscription: user.subscriptionPlan,
        credits: user.credits
      }
    });
  } catch (error) {
    logger.error('Error fetching subscription:', error);
    return next(createError('Error fetching subscription', 500));
  }
});

/**
 * Buy additional credits
 * @route POST /api/payment/buy-credits
 * @access Private
 */
export const buyCredits = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { creditAmount, paymentMethodId } = req.body;
  
  if (!creditAmount || !paymentMethodId) {
    return next(createError('Credit amount and payment method ID are required', 400));
  }
  
  const creditPackages = {
    small: { amount: 10000, price: 9.99 },
    medium: { amount: 50000, price: 39.99 },
    large: { amount: 100000, price: 69.99 }
  };
  
  const packageKey = creditAmount as keyof typeof creditPackages;
  if (!creditPackages[packageKey]) {
    return next(createError('Invalid credit package', 400));
  }
  
  const creditPackage = creditPackages[packageKey];
  
  try {
    // Get user
    const user = await User.findById(req.user!.id);
    
    if (!user) {
      return next(createError('User not found', 404));
    }
    
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name
      });
      
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(creditPackage.price * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      description: `TextBuilder.ai - ${creditPackage.amount} Credits`,
      confirm: true,
      off_session: true
    });
    
    if (paymentIntent.status === 'succeeded') {
      // Add credits to user
      user.credits += creditPackage.amount;
      await user.save();
      
      // Create credit transaction
      await user.createCreditTransaction({
        amount: creditPackage.amount,
        type: 'purchase',
        description: `Purchased ${creditPackage.amount} credits`,
        metadata: { paymentIntentId: paymentIntent.id }
      });
      
      res.status(200).json({
        success: true,
        data: {
          credits: user.credits,
          added: creditPackage.amount,
          paymentIntent: paymentIntent.id
        }
      });
    } else {
      return next(createError('Payment failed', 400));
    }
  } catch (error) {
    logger.error('Error buying credits:', error);
    return next(createError('Error processing credit purchase', 500));
  }
});

/**
 * Helper function to get plan details
 */
const getPlanDetails = (planId: SubscriptionPlanType): { price: number; monthlyCredits: number; name: string } => {
  switch (planId) {
    case SubscriptionPlanType.PRO:
      return { price: 99, monthlyCredits: 100000, name: 'Pro' };
    case SubscriptionPlanType.PLUS:
      return { price: 179, monthlyCredits: 200000, name: 'Plus' };
    case SubscriptionPlanType.PLATINUM:
      return { price: 279, monthlyCredits: 300000, name: 'Platinum' };
    case SubscriptionPlanType.AGENCY:
      return { price: 495, monthlyCredits: 600000, name: 'Agency' };
    default:
      return { price: 99, monthlyCredits: 100000, name: 'Pro' };
  }
};
