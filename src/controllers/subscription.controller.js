const {
    user: UserModel,
    subscription: SubscriptionModel,
    professionalProfile: ProfessionalProfileModel
} = require('../models');
const { createCheckoutSession, getSubscription, cancelSubscription } = require('../services/stripe.service');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const createError = require('http-errors');

/**
 * Create Stripe Checkout Session
 */
const createSubscriptionCheckout = async (req, res) => {
    try {
        const { planType, billingCycle } = req.body;
        const userId = req.loginUser.id;

        // Get user details
        const user = await UserModel.findByPk(userId);
        if (!user) {
            throw new createError.NotFound('User not found');
        }

        // Validate plan type and billing cycle
        const validPlans = ['essential', 'advanced', 'premium'];
        const validCycles = ['monthly', 'annual'];

        if (!validPlans.includes(planType)) {
            throw new createError.BadRequest('Invalid plan type');
        }

        if (!validCycles.includes(billingCycle)) {
            throw new createError.BadRequest('Invalid billing cycle');
        }

        // Create Stripe checkout session
        const session = await createCheckoutSession(
            planType,
            billingCycle,
            user.email,
            userId
        );

        return {
            data: {
                sessionId: session.id,
                url: session.url
            },
            message: 'Checkout session created successfully'
        };
    } catch (error) {
        console.error('Error in createSubscriptionCheckout:', error);
        throw error;
    }
};

/**
 * Handle Stripe Webhook
 */
const handleStripeWebhook = async (req, res) => {
    try {
        const sig = req.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        let event;

        try {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            throw new createError.BadRequest('Invalid webhook signature');
        }

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object);
                break;
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return {
            message: 'Webhook processed successfully'
        };
    } catch (error) {
        console.error('Error in handleStripeWebhook:', error);
        throw error;
    }
};

/**
 * Handle Checkout Completed
 */
const handleCheckoutCompleted = async (session) => {
    try {
        const userId = session.metadata.userId;
        const planType = session.metadata.planType;
        const billingCycle = session.metadata.billingCycle;

        // Create or update subscription in database
        await SubscriptionModel.upsert({
            userId: userId,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            status: 'active',
            plan: planType,
            stripePriceId: session.line_items?.data[0]?.price?.id || '',
            currentPeriodStart: new Date(),
            currentPeriodEnd: billingCycle === 'annual' 
                ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) 
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: false,
            isDeleted: false
        });

        console.log(`Subscription activated for user ${userId}, plan: ${planType}`);
    } catch (error) {
        console.error('Error handling checkout completed:', error);
        throw error;
    }
};

/**
 * Handle Subscription Updated
 */
const handleSubscriptionUpdated = async (subscription) => {
    try {
        await SubscriptionModel.update({
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end
        }, {
            where: { stripeSubscriptionId: subscription.id, isDeleted: false }
        });

        console.log(`Subscription updated: ${subscription.id}, status: ${subscription.status}`);
    } catch (error) {
        console.error('Error handling subscription updated:', error);
        throw error;
    }
};

/**
 * Handle Subscription Deleted
 */
const handleSubscriptionDeleted = async (subscription) => {
    try {
        await SubscriptionModel.update({
            status: 'canceled',
            currentPeriodEnd: new Date()
        }, {
            where: { stripeSubscriptionId: subscription.id, isDeleted: false }
        });

        console.log(`Subscription canceled: ${subscription.id}`);
    } catch (error) {
        console.error('Error handling subscription deleted:', error);
        throw error;
    }
};

/**
 * Get User Subscription Status
 */
const getSubscriptionStatus = async (req, res) => {
    try {
        const userId = req.loginUser.id;

        const subscription = await SubscriptionModel.findOne({
            where: { userId, isDeleted: false }
        });

        if (!subscription) {
            return {
                data: {
                    status: 'inactive',
                    plan: null,
                    startDate: null,
                    endDate: null,
                    isActive: false
                },
                message: 'No subscription found'
            };
        }

        return {
            data: {
                status: subscription.status,
                plan: subscription.plan,
                startDate: subscription.currentPeriodStart,
                endDate: subscription.currentPeriodEnd,
                isActive: subscription.status === 'active' && 
                         subscription.currentPeriodEnd && 
                         new Date(subscription.currentPeriodEnd) > new Date(),
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
            },
            message: 'Subscription status retrieved successfully'
        };
    } catch (error) {
        console.error('Error in getSubscriptionStatus:', error);
        throw error;
    }
};

/**
 * Cancel User Subscription
 */
const cancelUserSubscription = async (req, res) => {
    try {
        const userId = req.loginUser.id;

        const subscription = await SubscriptionModel.findOne({
            where: { userId, isDeleted: false, status: 'active' }
        });

        if (!subscription || !subscription.stripeSubscriptionId) {
            throw new createError.NotFound('No active subscription found');
        }

        // Cancel subscription in Stripe
        await cancelSubscription(subscription.stripeSubscriptionId);

        // Update local record
        await subscription.update({
            cancelAtPeriodEnd: true
        });

        return {
            message: 'Subscription will be canceled at the end of the current period'
        };
    } catch (error) {
        console.error('Error in cancelUserSubscription:', error);
        throw error;
    }
};

module.exports = {
    createSubscriptionCheckout,
    handleStripeWebhook,
    getSubscriptionStatus,
    cancelUserSubscription
};
