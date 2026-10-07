/**
 * Explicit Payment and Order State Machine Definitions
 * Strictly separates payment status from order confirmation, fulfillment, and shipment.
 */

export const PaymentStatus = {
    NOT_STARTED: 'NOT_STARTED',
    CHECKOUT_STARTED: 'CHECKOUT_STARTED',
    PENDING: 'PENDING',
    VERIFICATION_PENDING: 'VERIFICATION_PENDING',
    PAID: 'PAID',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED',
    REFUNDED: 'REFUNDED',
    NOT_FOUND: 'NOT_FOUND'
};

export const OrderStatus = {
    DRAFT: 'DRAFT',
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
};

export const FulfillmentStatus = {
    UNFULFILLED: 'UNFULFILLED',
    PROCESSING: 'PROCESSING',
    FULFILLED: 'FULFILLED'
};

export const ShipmentStatus = {
    NOT_AVAILABLE: 'NOT_AVAILABLE',
    LABEL_CREATED: 'LABEL_CREATED',
    IN_TRANSIT: 'IN_TRANSIT',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    DELIVERED: 'DELIVERED'
};

export const GumroadMappingStatus = {
    NOT_CONNECTED: 'NOT_CONNECTED',
    CONNECTED: 'CONNECTED',
    SYNCED: 'SYNCED',
    STALE: 'STALE',
    ERROR: 'ERROR',
    UNAVAILABLE: 'UNAVAILABLE'
};
