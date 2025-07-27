const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const SUBSCRIPTION_PLANS = {
  essential: {
    monthly: { priceId: "price_1RpTqCHaLC1wsFOqIdmnUZGs", amount: 3999 }, // €39.99
    annual: { priceId: 'price_essential_annual', amount: 47988 }   // €39.99 * 12
  },
  advanced: {
    monthly: { priceId: "price_1RpTqvHaLC1wsFOqQmi1faGX", amount: 7999 }, // €79.99
    annual: { priceId: 'price_advanced_annual', amount: 95988 }   // €79.99 * 12
  },
  premium: {
    monthly: { priceId: "price_1RpTu1HaLC1wsFOql0Y22BN0", amount: 14999 }, // €149.99
    annual: { priceId: 'price_premium_annual', amount: 179988 }   // €149.99 * 12
  }
};

/**
 * Create Stripe Checkout Session
 */
const createCheckoutSession = async (planType, billingCycle, customerEmail, userId) => {
  try {
    const plan = SUBSCRIPTION_PLANS[planType];
    if (!plan || !plan[billingCycle]) {
      throw new Error('Invalid plan or billing cycle');
    }

    const priceId = plan[billingCycle].priceId;

    const session = await stripe.checkout.sessions.create({
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
        billingCycle
      },
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
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

module.exports = {
  createCheckoutSession,
  getCustomerByEmail,
  createCustomer,
  getSubscription,
  cancelSubscription,
  SUBSCRIPTION_PLANS
};
