const {
    user: UserModel,
    subscription: SubscriptionModel,
    professionalProfile: ProfessionalProfileModel
} = require('../models');
const { 
    createCheckoutSession, 
    getSubscription, 
    cancelSubscription,
    createExpressAccount,
    generateAccountLink,
    retrieveAccountStatus,
    createDashboardLink,
    deleteExpressAccount
} = require('../services/stripe.service');
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
        console.log('Processing checkout completed for session:', session.id);
        console.log('Session metadata:', session.metadata);

        const userId = session.metadata.userId;
        const planType = session.metadata.planType;
        const billingCycle = session.metadata.billingCycle;
        const hasPromotion = session.metadata.hasPromotion === 'true';

        if (!userId || !planType || !billingCycle) {
            console.error('Missing required metadata:', { userId, planType, billingCycle });
            throw new Error('Missing required session metadata');
        }

        // Get the full session with line items
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ['line_items', 'subscription']
        });

        console.log('Full session retrieved with line items');

        // Calculate current period end based on promotional status
        let currentPeriodEnd;
        if (billingCycle === 'annual') {
            currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        } else {
            currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }

        // Create or update subscription in database
        const subscriptionData = {
            userId: parseInt(userId),
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            status: 'active',
            plan: planType,
            billingCycle: billingCycle,
            stripePriceId: fullSession.line_items?.data[0]?.price?.id || '',
            currentPeriodStart: new Date(),
            currentPeriodEnd: currentPeriodEnd,
            cancelAtPeriodEnd: false,
            isDeleted: false,
            // Track promotional information
            isPromotionalPricing: hasPromotion,
            promotionalPeriodEnd: hasPromotion ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
        };

        console.log('Creating subscription with data:', subscriptionData);

        await SubscriptionModel.upsert(subscriptionData);

        console.log(`✅ Subscription activated for user ${userId}, plan: ${planType}, promotion: ${hasPromotion}`);
    } catch (error) {
        console.error('❌ Error handling checkout completed:', error);
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
                    billingCycle: null,
                    startDate: null,
                    endDate: null,
                    isActive: false,
                    isPromotionalPricing: false,
                    promotionalPeriodEnd: null,
                    isPromotionalPeriodActive: false
                },
                message: 'No subscription found'
            };
        }

        // Check if promotional period is still active
        const isPromotionalPeriodActive = subscription.isPromotionalPricing && 
                                        subscription.promotionalPeriodEnd && 
                                        new Date(subscription.promotionalPeriodEnd) > new Date();

        return {
            data: {
                status: subscription.status,
                plan: subscription.plan,
                billingCycle: subscription.billingCycle,
                startDate: subscription.currentPeriodStart,
                endDate: subscription.currentPeriodEnd,
                isActive: subscription.status === 'active' && 
                         subscription.currentPeriodEnd && 
                         new Date(subscription.currentPeriodEnd) > new Date(),
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                isPromotionalPricing: subscription.isPromotionalPricing,
                promotionalPeriodEnd: subscription.promotionalPeriodEnd,
                isPromotionalPeriodActive: isPromotionalPeriodActive
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

/**
 * PAYMENT MANAGEMENT - Stripe Connect Controllers
 */

/**
 * Create Stripe Connect Account
 */
const createPaymentAccount = async (req, res) => {
    try {
        const userId = req.loginUser.id;
        const { email, country = 'US' } = req.body;

        // Check if user has professional profile
        const professionalProfile = await ProfessionalProfileModel.findOne({
            where: { userId, isDeleted: false }
        });

        if (!professionalProfile) {
            throw new createError.BadRequest('Professional profile not found');
        }

        // Check if already has a connected account
        if (professionalProfile.stripeConnectAccountId) {
            throw new createError.Conflict('Payment account already exists');
        }

        // Create Stripe Express account
        const account = await createExpressAccount(email, country);

        // Generate onboarding link
        const refreshUrl = `${process.env.FRONTEND_URL}/manage-payments?refresh=true`;
        const returnUrl = `${process.env.FRONTEND_URL}/manage-payments?success=true`;
        
        const accountLink = await generateAccountLink(account.id, refreshUrl, returnUrl);

        // Update professional profile
        await professionalProfile.update({
            stripeConnectAccountId: account.id,
            paymentAccountStatus: 'pending',
            paymentAccountEmail: email
        });

        return {
            data: {
                accountId: account.id,
                onboardingUrl: accountLink.url
            },
            message: 'Payment account created successfully'
        };

    } catch (error) {
        console.error('Error in createPaymentAccount:', error);
        throw error;
    }
};

/**
 * Get Payment Account Status
 */
const getPaymentAccountStatus = async (req, res) => {
    try {
        const userId = req.loginUser.id;

        const professionalProfile = await ProfessionalProfileModel.findOne({
            where: { userId, isDeleted: false }
        });

        if (!professionalProfile) {
            throw new createError.BadRequest('Professional profile not found');
        }

        // If no connected account
        if (!professionalProfile.stripeConnectAccountId) {
            return {
                data: {
                    hasAccount: false,
                    status: 'none',
                    email: null,
                    canReceivePayments: false
                },
                message: 'No payment account found'
            };
        }

        // Get account status from Stripe
        let accountStatus;
        try {
            accountStatus = await retrieveAccountStatus(professionalProfile.stripeConnectAccountId);
        } catch (stripeError) {
            // If account doesn't exist in Stripe, reset local data
            await professionalProfile.update({
                stripeConnectAccountId: null,
                paymentAccountStatus: 'none',
                paymentAccountEmail: null
            });

            return {
                data: {
                    hasAccount: false,
                    status: 'none',
                    email: null,
                    canReceivePayments: false
                },
                message: 'Payment account not found in Stripe'
            };
        }

        // Determine status
        let status = 'pending';
        if (accountStatus.details_submitted && accountStatus.charges_enabled) {
            status = 'active';
        } else if (accountStatus.requirements?.currently_due?.length > 0) {
            status = 'restricted';
        }

        // Update local status if different
        if (professionalProfile.paymentAccountStatus !== status) {
            await professionalProfile.update({ paymentAccountStatus: status });
        }

        return {
            data: {
                hasAccount: true,
                status: status,
                email: professionalProfile.paymentAccountEmail,
                canReceivePayments: accountStatus.charges_enabled && accountStatus.payouts_enabled,
                accountDetails: {
                    detailsSubmitted: accountStatus.details_submitted,
                    chargesEnabled: accountStatus.charges_enabled,
                    payoutsEnabled: accountStatus.payouts_enabled
                }
            },
            message: 'Payment account status retrieved successfully'
        };

    } catch (error) {
        console.error('Error in getPaymentAccountStatus:', error);
        throw error;
    }
};

/**
 * Get Dashboard Link
 */
const getPaymentDashboardLink = async (req, res) => {
    try {
        const userId = req.loginUser.id;

        const professionalProfile = await ProfessionalProfileModel.findOne({
            where: { userId, isDeleted: false }
        });

        if (!professionalProfile || !professionalProfile.stripeConnectAccountId) {
            throw new createError.BadRequest('No payment account found');
        }

        const dashboardLink = await createDashboardLink(professionalProfile.stripeConnectAccountId);

        return {
            data: {
                dashboardUrl: dashboardLink.url
            },
            message: 'Dashboard link generated successfully'
        };

    } catch (error) {
        console.error('Error in getPaymentDashboardLink:', error);
        throw error;
    }
};

/**
 * Remove Payment Account
 */
const removePaymentAccount = async (req, res) => {
    try {
        const userId = req.loginUser.id;

        const professionalProfile = await ProfessionalProfileModel.findOne({
            where: { userId, isDeleted: false }
        });

        if (!professionalProfile || !professionalProfile.stripeConnectAccountId) {
            throw new createError.BadRequest('No payment account found');
        }

        const accountId = professionalProfile.stripeConnectAccountId;

        // Delete account from Stripe
        try {
            await deleteExpressAccount(accountId);
        } catch (stripeError) {
            // If account already deleted in Stripe, continue with local cleanup
            console.warn('Account not found in Stripe during deletion:', stripeError.message);
        }

        // Update professional profile
        await professionalProfile.update({
            stripeConnectAccountId: null,
            paymentAccountStatus: 'none',
            paymentAccountEmail: null
        });

        return {
            message: 'Payment account removed successfully'
        };

    } catch (error) {
        console.error('Error in removePaymentAccount:', error);
        throw error;
    }
};

/**
 * Manual Subscription Creation (for debugging)
 */
const createManualSubscription = async (req, res) => {
    try {
        const { userId, planType, billingCycle = 'monthly' } = req.body;
        
        if (!userId || !planType) {
            throw new createError.BadRequest('userId and planType are required');
        }

        const subscriptionData = {
            userId: parseInt(userId),
            stripeCustomerId: `cus_test_${Date.now()}`,
            stripeSubscriptionId: `sub_test_${Date.now()}`,
            status: 'active',
            plan: planType,
            billingCycle: billingCycle,
            stripePriceId: 'price_test',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: false,
            isDeleted: false,
            isPromotionalPricing: true,
            promotionalPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        };

        console.log('Creating manual subscription:', subscriptionData);
        
        const subscription = await SubscriptionModel.create(subscriptionData);
        
        return {
            data: subscription,
            message: 'Manual subscription created successfully'
        };
    } catch (error) {
        console.error('Error creating manual subscription:', error);
        throw error;
    }
};

module.exports = {
    createSubscriptionCheckout,
    handleStripeWebhook,
    getSubscriptionStatus,
    cancelUserSubscription,
    createManualSubscription,
    // Payment Management
    createPaymentAccount,
    getPaymentAccountStatus,
    getPaymentDashboardLink,
    removePaymentAccount
};
