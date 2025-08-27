const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const SUBSCRIPTION_PLANS = {
  essential: {
    monthly: { 
      priceId: "price_1RpTqCHaLC1wsFOqIdmnUZGs", 
      amount: 3999, // €39.99
      promotionalPrice: 100, // €1.00 for first month
      hasPromotion: true
    },
    annual: { 
      priceId: 'price_essential_annual', 
      amount: 42989, // €429.99 (10% discount from 12 * €39.99)
      hasPromotion: false
    }
  },
  advanced: {
    monthly: { 
      priceId: "price_1RpTqvHaLC1wsFOqQmi1faGX", 
      amount: 7999, // €79.99
      promotionalPrice: 3999, // €39.99 for first month
      hasPromotion: true
    },
    annual: { 
      priceId: 'price_advanced_annual', 
      amount: 85989, // €859.99 (10% discount from 12 * €79.99)
      hasPromotion: false
    }
  },
  premium: {
    monthly: { 
      priceId: "price_1RpTu1HaLC1wsFOql0Y22BN0", 
      amount: 14999, // €149.99
      hasPromotion: false
    },
    annual: { 
      priceId: 'price_premium_annual', 
      amount: 161989, // €1619.99 (10% discount from 12 * €149.99)
      hasPromotion: false
    }
  }
};

/**
 * Create Stripe Checkout Session with Promotional Pricing Support
 */
const createCheckoutSession = async (planType, billingCycle, customerEmail, userId) => {
  try {
    const plan = SUBSCRIPTION_PLANS[planType];
    if (!plan || !plan[billingCycle]) {
      throw new Error('Invalid plan or billing cycle');
    }

    const planConfig = plan[billingCycle];
    const priceId = planConfig.priceId;

    // Base session configuration
    const sessionConfig = {
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: customerEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId.toString(),
        planType,
        billingCycle,
        hasPromotion: planConfig.hasPromotion ? 'true' : 'false'
      },
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
    };

    // Handle promotional pricing for monthly plans with offers
    if (billingCycle === 'monthly' && planConfig.hasPromotion) {
      // Apply discount coupon for first month promotional pricing
      const couponId = await getOrCreatePromotionalCoupon(planType, planConfig.promotionalPrice, planConfig.amount);
      
      sessionConfig.discounts = [
        {
          coupon: couponId
        }
      ];

      // Add promotional metadata
      sessionConfig.metadata.promotional_price = planConfig.promotionalPrice.toString();
      sessionConfig.metadata.regular_price = planConfig.amount.toString();
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

/**
 * Get or Create Promotional Coupon for First Month Discount
 */
const getOrCreatePromotionalCoupon = async (planType, promotionalPrice, regularPrice) => {
  try {
    const couponId = `promo-${planType}-first-month`;
    
    try {
      // Try to retrieve existing coupon
      const existingCoupon = await stripe.coupons.retrieve(couponId);
      return existingCoupon.id;
    } catch (error) {
      // Coupon doesn't exist, create it
      if (error.code === 'resource_missing') {
        const discountAmount = regularPrice - promotionalPrice;
        
        const coupon = await stripe.coupons.create({
          id: couponId,
          name: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan - First Month Offer`,
          amount_off: discountAmount,
          currency: 'eur',
          duration: 'once', // Only applies to first payment
          max_redemptions: 10000 // High limit for promotional use
        });
        
        return coupon.id;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error handling promotional coupon:', error);
    throw error;
  }
};

/**
 * Get Customer by Email
 */
const getCustomerByEmail = async (email) => {
  try {
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });
    return customers.data.length > 0 ? customers.data[0] : null;
  } catch (error) {
    console.error('Error getting customer:', error);
    throw error;
  }
};

/**
 * Create Customer
 */
const createCustomer = async (email, name) => {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
    });
    return customer;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
};

/**
 * Get Subscription by ID
 */
const getSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error getting subscription:', error);
    throw error;
  }
};

/**
 * Cancel Subscription
 */
const cancelSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    return subscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};

/**
 * Stripe Connect - Payment Management Functions
 */

/**
 * Create Stripe Express Account
 */
const createExpressAccount = async (email, country = 'US') => {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country: country,
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    return account;
  } catch (error) {
    console.error('Error creating Express account:', error);
    throw error;
  }
};

/**
 * Generate Account Link for Onboarding
 */
const generateAccountLink = async (accountId, refreshUrl, returnUrl) => {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return accountLink;
  } catch (error) {
    console.error('Error generating account link:', error);
    throw error;
  }
};

/**
 * Retrieve Account Status
 */
const retrieveAccountStatus = async (accountId) => {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    
    return {
      id: account.id,
      email: account.email,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      requirements: account.requirements,
      business_profile: account.business_profile,
    };
  } catch (error) {
    console.error('Error retrieving account status:', error);
    throw error;
  }
};

/**
 * Create Dashboard Link
 */
const createDashboardLink = async (accountId) => {
  try {
    const link = await stripe.accounts.createLoginLink(accountId);
    return link;
  } catch (error) {
    console.error('Error creating dashboard link:', error);
    throw error;
  }
};

/**
 * Delete Express Account
 */
const deleteExpressAccount = async (accountId) => {
  try {
    const deletedAccount = await stripe.accounts.del(accountId);
    return deletedAccount;
  } catch (error) {
    console.error('Error deleting Express account:', error);
    throw error;
  }
};

/**
 * Booking Payment Functions - Production Ready
 */

/**
 * Calculate booking payment amounts
 */
const calculateBookingAmounts = (totalAmount) => {
  const total = parseFloat(totalAmount);
  const upfrontAmount = total * 0.30; // 30% upfront
  const remainingAmount = total * 0.70; // 70% remaining
  const platformFee = 0; // No platform fee - full amount goes to professional
  const professionalTotal = total; // 100% to professional
  const professionalUpfront = upfrontAmount; // Professional gets full upfront amount
  const professionalRemaining = remainingAmount; // Professional gets full remaining amount

  return {
    totalAmount: total,
    upfrontAmount: parseFloat(upfrontAmount.toFixed(2)),
    remainingAmount: parseFloat(remainingAmount.toFixed(2)),
    platformFee: parseFloat(platformFee.toFixed(2)),
    professionalTotal: parseFloat(professionalTotal.toFixed(2)),
    professionalUpfront: parseFloat(professionalUpfront.toFixed(2)),
    professionalRemaining: parseFloat(professionalRemaining.toFixed(2))
  };
};

/**
 * Create Payment Intent for booking upfront payment (30%)
 */
const createBookingPaymentIntent = async (bookingData, clientEmail) => {
  try {
    const { totalAmount, professionalStripeAccountId, bookingId, clientId, currency } = bookingData;
    const amounts = calculateBookingAmounts(totalAmount);

    // Find or create customer
    let customer = await getCustomerByEmail(clientEmail);
    if (!customer) {
      customer = await createCustomer(clientEmail, clientEmail.split('@')[0]);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amounts.upfrontAmount * 100), // Convert to cents
      currency: 'eur',
      customer: customer.id,
      capture_method: 'manual', // Manual capture for better control
      setup_future_usage: 'off_session', // This ensures PaymentMethod is saved for future use
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
      // No application_fee_amount - full amount goes to professional
      transfer_data: {
        destination: professionalStripeAccountId,
      },
      metadata: {
        type: 'booking_upfront',
        booking_id: bookingId.toString(),
        client_id: clientId.toString(),
        professional_account_id: professionalStripeAccountId,
        total_amount: totalAmount.toString(),
        upfront_amount: amounts.upfrontAmount.toString(),
        platform_fee: amounts.platformFee.toString()
      },
      description: `Booking upfront payment - 30% of EUR${totalAmount}`
    });

    return {
      paymentIntent,
      amounts
    };
  } catch (error) {
    console.error('Error creating booking payment intent:', error);
    throw error;
  }
};

/**
 * Create Payment Intent for remaining payment (70%) - held for later capture
 */
const createRemainingPaymentIntent = async (bookingData, clientEmail, originalPaymentMethodId) => {
  try {
    const { totalAmount, professionalStripeAccountId, bookingId, clientId, currency } = bookingData;
    const amounts = calculateBookingAmounts(totalAmount);

    // Find or create customer
    console.log(`Looking for customer with email: ${clientEmail}`);
    let customer = await getCustomerByEmail(clientEmail);
    if (!customer) {
      console.log(`Customer not found, creating new customer for email: ${clientEmail}`);
      customer = await createCustomer(clientEmail, clientEmail.split('@')[0]);
      console.log(`Created new customer: ${customer.id}`);
    } else {
      console.log(`Found existing customer: ${customer.id}`);
    }

    // Find the customer's attached PaymentMethods
    let paymentMethodToUse = null;
    
    try {
      console.log(`Looking for PaymentMethods for customer: ${customer.id}`);
      console.log(`Original PaymentMethod ID: ${originalPaymentMethodId}`);
      
      const attachedPaymentMethods = await stripe.paymentMethods.list({
        customer: customer.id,
        type: 'card',
      });
      
      console.log(`Found ${attachedPaymentMethods.data.length} attached PaymentMethods for customer`);
      
      // Look for the original payment method in attached methods
      paymentMethodToUse = attachedPaymentMethods.data.find(pm => pm.id === originalPaymentMethodId);
      
      if (paymentMethodToUse) {
        console.log(`Found original PaymentMethod ${originalPaymentMethodId} attached to customer`);
      } else if (attachedPaymentMethods.data.length > 0) {
        // Use the most recent one if original not found
        paymentMethodToUse = attachedPaymentMethods.data[0];
        console.log(`Using most recent attached PaymentMethod: ${paymentMethodToUse.id}`);
      }
      
      if (!paymentMethodToUse) {
        throw new Error('No payment method attached to customer. Please contact support.');
      }
      
    } catch (pmError) {
      console.error('Error retrieving customer payment methods:', pmError);
      throw new Error('Unable to retrieve payment method for remaining payment. Please contact support.');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amounts.remainingAmount * 100), // Convert to cents
      currency: 'eur',
      customer: customer.id,
      payment_method: paymentMethodToUse.id,
      capture_method: 'manual',
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
      // No application_fee_amount - full amount goes to professional
      transfer_data: {
        destination: professionalStripeAccountId,
      },
      metadata: {
        type: 'booking_remaining',
        booking_id: bookingId.toString(),
        client_id: clientId.toString(),
        professional_account_id: professionalStripeAccountId,
        total_amount: totalAmount.toString(),
        remaining_amount: amounts.remainingAmount.toString(),
        platform_fee_remaining: (amounts.platformFee * 0.70).toString(),
        original_payment_method_id: originalPaymentMethodId
      },
      description: `Booking remaining payment - 70% of EUR${totalAmount}`
    });

    return {
      paymentIntent,
      amounts
    };
  } catch (error) {
    console.error('Error creating remaining payment intent:', error);
    throw error;
  }
};

/**
 * Confirm and capture upfront payment - handles all PaymentIntent statuses
 */
const confirmAndCaptureUpfrontPayment = async (paymentIntentId) => {
  try {
    // First, retrieve the current status of the payment intent
    let paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log(`PaymentIntent ${paymentIntentId} current status: ${paymentIntent.status}`);
    
    // Handle different payment intent statuses
    switch (paymentIntent.status) {
      case 'requires_confirmation':
        // Payment method attached, needs confirmation
        console.log('Confirming PaymentIntent...');
        paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
        
        // After confirmation, check if it needs capture
        if (paymentIntent.status === 'requires_capture') {
          console.log('Capturing PaymentIntent after confirmation...');
          paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
        }
        break;
        
      case 'requires_capture':
        // Payment method already confirmed, just needs capture
        console.log('Capturing PaymentIntent...');
        paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
        break;
        
      case 'requires_action':
        // Client needs to complete additional authentication (3D Secure, etc.)
        console.log('PaymentIntent requires additional client action');
        return {
          status: paymentIntent.status,
          client_secret: paymentIntent.client_secret,
          next_action: paymentIntent.next_action,
          message: 'Additional authentication required. Please complete the payment on the frontend.'
        };
        
      case 'requires_payment_method':
        // No payment method attached yet
        throw new Error('PaymentIntent requires a payment method. Please attach a payment method first.');
        
      case 'succeeded':
        // Already processed successfully
        console.log('PaymentIntent already succeeded');
        break;
        
      case 'canceled':
        throw new Error('PaymentIntent has been canceled and cannot be processed.');
        
      case 'processing':
        // Payment is being processed
        console.log('PaymentIntent is currently processing...');
        break;
        
      default:
        throw new Error(`Unexpected PaymentIntent status: ${paymentIntent.status}`);
    }
    
    // If payment succeeded, try to attach PaymentMethod to Customer for future use
    if (paymentIntent.status === 'succeeded' && paymentIntent.payment_method && paymentIntent.customer) {
      try {
        console.log('Attaching PaymentMethod to Customer for future payments...');
        await stripe.paymentMethods.attach(paymentIntent.payment_method, {
          customer: paymentIntent.customer,
        });
        console.log(`PaymentMethod ${paymentIntent.payment_method} attached to Customer ${paymentIntent.customer}`);
      } catch (attachError) {
        // Don't fail the payment if attachment fails
        console.log('PaymentMethod attachment info:', attachError.message);
      }
    }
    
    return paymentIntent;
  } catch (error) {
    console.error('Error confirming and capturing upfront payment:', error);
    
    // Provide more specific error messages
    if (error.code === 'payment_intent_unexpected_state') {
      throw new Error(`Payment cannot be processed due to its current state: ${error.payment_intent?.status || 'unknown'}`);
    }
    
    throw error;
  }
};

/**
 * Capture remaining payment when confirmation code is verified - handles all PaymentIntent statuses
 */
const captureRemainingPayment = async (paymentIntentId) => {
  try {
    // First, retrieve the current status of the payment intent
    let paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log(`Remaining PaymentIntent ${paymentIntentId} current status: ${paymentIntent.status}`);
    
    // Handle different payment intent statuses
    switch (paymentIntent.status) {
      case 'requires_confirmation':
        // Payment method attached, needs confirmation
        console.log('Confirming remaining PaymentIntent...');
        paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
        
        // After confirmation, check if it needs capture
        if (paymentIntent.status === 'requires_capture') {
          console.log('Capturing remaining PaymentIntent after confirmation...');
          paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
        }
        break;
        
      case 'requires_capture':
        // Payment method already confirmed, just needs capture
        console.log('Capturing remaining PaymentIntent...');
        paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
        break;
        
      case 'requires_action':
        // Client needs to complete additional authentication
        console.log('Remaining PaymentIntent requires additional client action');
        return {
          status: paymentIntent.status,
          client_secret: paymentIntent.client_secret,
          next_action: paymentIntent.next_action,
          message: 'Additional authentication required for remaining payment.'
        };
        
      case 'requires_payment_method':
        throw new Error('Remaining PaymentIntent requires a payment method. Please attach a payment method first.');
        
      case 'succeeded':
        // Already processed successfully
        console.log('Remaining PaymentIntent already succeeded');
        break;
        
      case 'canceled':
        throw new Error('Remaining PaymentIntent has been canceled and cannot be processed.');
        
      case 'processing':
        // Payment is being processed
        console.log('Remaining PaymentIntent is currently processing...');
        break;
        
      default:
        throw new Error(`Unexpected remaining PaymentIntent status: ${paymentIntent.status}`);
    }
    
    return paymentIntent;
  } catch (error) {
    console.error('Error capturing remaining payment:', error);
    
    // Provide more specific error messages
    if (error.code === 'payment_intent_unexpected_state') {
      throw new Error(`Remaining payment cannot be processed due to its current state: ${error.payment_intent?.status || 'unknown'}`);
    }
    
    throw error;
  }
};

/**
 * Cancel payment intent (for cancellations before capture)
 */
const cancelPaymentIntent = async (paymentIntentId) => {
  try {
    const cancelledIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    return cancelledIntent;
  } catch (error) {
    console.error('Error cancelling payment intent:', error);
    throw error;
  }
};

/**
 * Ensure PaymentMethod is attached to Customer (helper function)
 */
const ensurePaymentMethodAttached = async (paymentMethodId, customerId) => {
  try {
    // Check if PaymentMethod is already attached to this customer
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    if (paymentMethod.customer === customerId) {
      console.log(`PaymentMethod ${paymentMethodId} already attached to Customer ${customerId}`);
      return true;
    }
    
    // Attach the PaymentMethod to the Customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    
    console.log(`Successfully attached PaymentMethod ${paymentMethodId} to Customer ${customerId}`);
    return true;
  } catch (error) {
    console.error('Error attaching PaymentMethod to Customer:', error);
    throw new Error(`Failed to attach payment method: ${error.message}`);
  }
};

/**
 * Get payment intent details
 */
const getPaymentIntentDetails = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    throw error;
  }
};

/**
 * Get setup intent details
 */
const getSetupIntentDetails = async (setupIntentId) => {
  try {
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    return setupIntent;
  } catch (error) {
    console.error('Error retrieving setup intent:', error);
    throw error;
  }
};

/**
 * Process refund for booking payment
 */
const processBookingRefund = async (paymentIntentId, refundAmount, reason = 'requested_by_customer') => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: Math.round(refundAmount * 100), // Convert to cents
      reason: reason,
      metadata: {
        refund_type: 'booking_cancellation'
      }
    });
    
    return refund;
  } catch (error) {
    console.error('Error processing booking refund:', error);
    throw error;
  }
};

module.exports = {
  createCheckoutSession,
  getCustomerByEmail,
  createCustomer,
  getSubscription,
  cancelSubscription,
  // Stripe Connect functions
  createExpressAccount,
  generateAccountLink,
  retrieveAccountStatus,
  createDashboardLink,
  deleteExpressAccount,
  // Booking Payment functions
  calculateBookingAmounts,
  createBookingPaymentIntent,
  createRemainingPaymentIntent,
  confirmAndCaptureUpfrontPayment,
  captureRemainingPayment,
  cancelPaymentIntent,
  getPaymentIntentDetails,
  getSetupIntentDetails,
  ensurePaymentMethodAttached,
  processBookingRefund,
  SUBSCRIPTION_PLANS
};
