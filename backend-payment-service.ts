// backend/src/services/payment/processor.ts
import Stripe from 'stripe';
import { createLogger } from '../../utils/logger';
import User, { SubscriptionPlanType } from '../../models/User';
import CreditTransaction, { TransactionType } from '../../models/CreditTransaction';

const logger = createLogger('payment-service');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15',
});

export interface PaymentProcessorOptions {
  userId: string;
  planId: SubscriptionPlanType;
  paymentMethodId: string;
  isLifetime?: boolean;
}

export class PaymentProcessor {
  /**
   * Process a new subscription or one-time payment
   */
  public async processPayment(options: PaymentProcessorOptions): Promise<any> {
    const { userId, planId, paymentMethodId, isLifetime = true } = options;
    
    try {
      // Get user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Get plan details
      const planDetails = this.getPlanDetails(planId);
      
      // Create or retrieve Stripe customer
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          payment_method: paymentMethodId,
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
        
        customerId = customer.id;
        
        // Save Stripe customer ID to user
        user.stripeCustomerId = customerId;
        await user.save();
      }
      
      let paymentResponse;
      
      if (isLifetime) {
        // Process one-time payment for lifetime access
        paymentResponse = await this.processOneTimePayment(customerId, paymentMethodId, planDetails.price, `TextBuilder.ai ${planDetails.name} Lifetime`);
      } else {
        // Process subscription
        paymentResponse = await this.processSubscription(customerId, paymentMethodId, planDetails.price, `TextBuilder.ai ${planDetails.name} Monthly`);
      }
      
      // Update user's subscription
      user.subscriptionPlan = {
        type: planId,
        monthlyCredits: planDetails.monthlyCredits,
        isLifetime,
        purchasedAt: new Date(),
        expiresAt: isLifetime ? undefined : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };
      
      // Add credits
      user.credits += planDetails.monthlyCredits;
      
      await user.save();
      
      // Create credit transaction
      await CreditTransaction.create({
        user: userId,
        amount: planDetails.monthlyCredits,
        type: TransactionType.PURCHASE,
        description: `${isLifetime ? 'Lifetime' : 'Monthly'} ${planDetails.name} Plan Purchase`,
        metadata: {
          planId,
          paymentId: paymentResponse.id,
        },
      });
      
      return {
        success: true,
        subscription: user.subscriptionPlan,
        payment: paymentResponse,
      };
    } catch (error) {
      logger.error('Payment processing error:', error);
      throw error;
    }
  }
  
  /**
   * Process a one-time payment with Stripe
   */
  private async processOneTimePayment(customerId: string, paymentMethodId: string, amount: number, description: string): Promise<Stripe.PaymentIntent> {
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      description,
      confirm: true,
      off_session: true,
    });
    
    return paymentIntent;
  }
  
  /**
   * Process a subscription with Stripe
   */
  private async processSubscription(customerId: string, paymentMethodId: string, amount: number, description: string): Promise<Stripe.Subscription> {
    // Create a product and price for the subscription
    const product = await stripe.products.create({
      name: description,
    });
    
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: amount * 100, // Convert to cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
    
    // Create a subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      default_payment_method: paymentMethodId,
    });
    
    return subscription;
  }
  
  /**
   * Get plan details based on plan ID
   */
  private getPlanDetails(planId: SubscriptionPlanType): { price: number; monthlyCredits: number; name: string } {
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
  }
  
  /**
   * Handle Stripe webhook events
   */
  public async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
          break;
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
          break;
        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      logger.error('Error handling webhook event:', error);
      throw error;
    }
  }
  
  /**
   * Handle successful payment
   */
  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    logger.info(`Payment succeeded: ${paymentIntent.id}`);
    // In a real implementation, you might want to update payment status in your database
  }
  
  /**
   * Handle failed payment
   */
  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    logger.error(`Payment failed: ${paymentIntent.id}`);
    // In a real implementation, you might want to notify the user or take action
  }
  
  /**
   * Handle subscription creation
   */
  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    logger.info(`Subscription created: ${subscription.id}`);
    // In a real implementation, you might want to update subscription status in your database
  }
  
  /**
   * Handle subscription update
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    logger.info(`Subscription updated: ${subscription.id}`);
    // In a real implementation, you might want to update subscription status in your database
  }
  
  /**
   * Handle subscription cancellation
   */
  private async handleSubscriptionCancelled(subscription: Stripe.Subscription): Promise<void> {
    logger.info(`Subscription cancelled: ${subscription.id}`);
    
    // Find user with this subscription
    const user = await User.findOne({ stripeCustomerId: subscription.customer });
    
    if (user) {
      // Mark subscription as expired if it's not a lifetime plan
      if (!user.subscriptionPlan.isLifetime) {
        user.subscriptionPlan.expiresAt = new Date();
        await user.save();
      }
    }
  }
}

// Create and export singleton instance
export const paymentProcessor = new PaymentProcessor();
export default paymentProcessor;
