import { loadStripe } from "@stripe/stripe-js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Cache the stripe config and instance
let stripeConfigCache = null;
let stripePromiseCache = null;

/**
 * Fetch Stripe configuration from the backend
 * This determines whether we're in test or live mode
 */
export const fetchStripeConfig = async () => {
    if (stripeConfigCache) {
        return stripeConfigCache;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/payments/stripe-config`);
        if (!response.ok) {
            throw new Error('Failed to fetch Stripe config');
        }

        stripeConfigCache = await response.json();
        console.log(`💳 Stripe mode: ${stripeConfigCache.mode.toUpperCase()}`);
        return stripeConfigCache;
    } catch (error) {
        console.error('Error fetching Stripe config:', error);
        // Fallback to environment variable if backend is unreachable
        const fallbackKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
        console.warn('Using fallback Stripe key from environment');
        stripeConfigCache = {
            mode: fallbackKey?.startsWith('pk_live') ? 'live' : 'test',
            publishableKey: fallbackKey,
            isLiveMode: fallbackKey?.startsWith('pk_live')
        };
        return stripeConfigCache;
    }
};

/**
 * Get the Stripe promise with the correct publishable key
 * based on the current mode (test/live) from the backend
 */
export const getStripePromise = async () => {
    if (stripePromiseCache) {
        return stripePromiseCache;
    }

    const config = await fetchStripeConfig();
    stripePromiseCache = loadStripe(config.publishableKey);
    return stripePromiseCache;
};

/**
 * Check if Stripe is in live mode
 */
export const isStripeInLiveMode = async () => {
    const config = await fetchStripeConfig();
    return config.isLiveMode;
};

/**
 * Get the current Stripe mode ('test' or 'live')
 */
export const getStripeMode = async () => {
    const config = await fetchStripeConfig();
    return config.mode;
};

// Export a pre-loaded promise that can be used immediately
// This will be resolved when the config is fetched
export const stripePromise = getStripePromise();
