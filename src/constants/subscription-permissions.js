'use strict';

const SUBSCRIPTION_PERMISSIONS = {
  essential: {
    planName: "Essential",
    limits: {
      portfolioImages: 10,
      teamMembers: 1,
      monthlyBookings: 50,
      supportLevel: "standard"
    },
    features: {
      profileManagement: true,
      bookingManagement: true,
      paymentProcessing: true,
      contractManagement: true,
      reviewResponse: true,
      searchVisibility: "standard",
      promotionalTools: false,
      analytics: false,
      prioritySupport: false,
      teamManagement: false
    }
  },
  
  advanced: {
    planName: "Advanced",
    limits: {
      portfolioImages: 25,
      teamMembers: 1,
      monthlyBookings: 150,
      supportLevel: "priority"
    },
    features: {
      profileManagement: true,
      bookingManagement: true,
      paymentProcessing: true,
      contractManagement: true,
      reviewResponse: true,
      searchVisibility: "highlighted",
      promotionalTools: true,
      inAppAdvertising: true,
      analytics: true,
      performanceReports: true,
      profileCustomization: true,
      prioritySupport: true,
      teamManagement: false
    }
  },
  
  premium: {
    planName: "Premium",
    limits: {
      portfolioImages: 100,
      teamMembers: 4,
      monthlyBookings: 500,
      supportLevel: "premium"
    },
    features: {
      profileManagement: true,
      bookingManagement: true,
      paymentProcessing: true,
      contractManagement: true,
      reviewResponse: true,
      searchVisibility: "featured",
      promotionalTools: true,
      inAppAdvertising: true,
      analytics: true,
      performanceReports: true,
      profileCustomization: true,
      prioritySupport: true,
      teamManagement: true,
      whiteLabeling: true,
      customBranding: true,
      projectManagement: true,
      sharedCalendar: true
    }
  },
  
  inactive: {
    planName: "Inactive",
    limits: {
      portfolioImages: 3,
      teamMembers: 0,
      monthlyBookings: 0,
      supportLevel: "none"
    },
    features: {
      profileManagement: false,
      bookingManagement: false,
      paymentProcessing: false,
      contractManagement: false,
      reviewResponse: false,
      searchVisibility: "hidden",
      promotionalTools: false,
      analytics: false,
      prioritySupport: false,
      teamManagement: false
    }
  }
};

module.exports = SUBSCRIPTION_PERMISSIONS;
