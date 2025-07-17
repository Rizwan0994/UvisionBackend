// Professional Profile Constants

// Professional Status
const PROFESSIONAL_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    PENDING_APPROVAL: 'pending_approval'
};

// Professional Level
const PROFESSIONAL_LEVEL = {
    LEVEL_01: 'Level 01',
    LEVEL_02: 'Level 02', 
    LEVEL_03: 'Level 03',
    EXPERT: 'Expert',
    MASTER: 'Master'
};

// Service Types
const SERVICE_TYPE = {
    PHOTOGRAPHY: 'photography',
    VIDEOGRAPHY: 'videography',
    DESIGN: 'design',
    CONSULTATION: 'consultation',
    EVENT_PLANNING: 'event_planning',
    WEDDING: 'wedding',
    CORPORATE: 'corporate',
    PORTRAIT: 'portrait',
    PRODUCT: 'product'
};

// Booking Status
const BOOKING_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
    DISPUTED: 'disputed'
};

// Payment Status
const PAYMENT_STATUS = {
    PENDING: 'pending',
    PARTIAL: 'partial',
    PAID: 'paid',
    REFUNDED: 'refunded',
    FAILED: 'failed'
};

// Media Types
const MEDIA_TYPE = {
    IMAGE: 'image',
    VIDEO: 'video',
    DOCUMENT: 'document'
};

// Availability Types
const AVAILABILITY_TYPE = {
    RECURRING: 'recurring',
    SPECIFIC: 'specific',
    BLOCKED: 'blocked'
};

// Days of Week
const DAYS_OF_WEEK = {
    MONDAY: 'monday',
    TUESDAY: 'tuesday',
    WEDNESDAY: 'wednesday',
    THURSDAY: 'thursday',
    FRIDAY: 'friday',
    SATURDAY: 'saturday',
    SUNDAY: 'sunday'
};

// Equipment Condition
const EQUIPMENT_CONDITION = {
    NEW: 'new',
    EXCELLENT: 'excellent',
    GOOD: 'good',
    FAIR: 'fair',
    POOR: 'poor'
};

// Rating Scale
const RATING_SCALE = {
    MIN: 1.0,
    MAX: 5.0
};

// Currency
const DEFAULT_CURRENCY = 'EUR';

// Profile Completion Steps
const PROFILE_COMPLETION_STEPS = {
    BASIC_INFO: 10,
    PROFESSIONAL_DETAILS: 20,
    SERVICES: 20,
    PORTFOLIO: 20,
    AVAILABILITY: 15,
    EQUIPMENT: 10,
    VERIFICATION: 5
};

module.exports = {
    PROFESSIONAL_STATUS,
    PROFESSIONAL_LEVEL,
    SERVICE_TYPE,
    BOOKING_STATUS,
    PAYMENT_STATUS,
    MEDIA_TYPE,
    AVAILABILITY_TYPE,
    DAYS_OF_WEEK,
    EQUIPMENT_CONDITION,
    RATING_SCALE,
    DEFAULT_CURRENCY,
    PROFILE_COMPLETION_STEPS
};
