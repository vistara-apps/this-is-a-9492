// Stripe integration for subscription management
// Note: In production, most Stripe operations should happen on your backend for security

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

let stripe = null

// Initialize Stripe (would typically load from CDN in production)
if (stripePublishableKey && typeof window !== 'undefined') {
  // In a real app, you'd load Stripe.js from their CDN
  console.log('Stripe publishable key found, but Stripe.js not loaded in this demo')
} else {
  console.warn('Stripe publishable key not found. Using mock payment flow.')
}

/**
 * Create a subscription checkout session
 * @param {string} userId - User ID
 * @param {string} priceId - Stripe price ID for the subscription
 * @returns {Promise<{url: string}>}
 */
export async function createCheckoutSession(userId, priceId = 'price_pro_monthly') {
  if (!stripe) {
    // Mock checkout for demo purposes
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          url: '#mock-checkout',
          sessionId: 'mock_session_' + Date.now()
        })
      }, 1000)
    })
  }

  try {
    // In a real app, this would call your backend API
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        priceId,
        successUrl: `${window.location.origin}/subscription-success`,
        cancelUrl: `${window.location.origin}/subscription-cancelled`
      })
    })

    const session = await response.json()
    return session
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

/**
 * Create a customer portal session for managing subscription
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<{url: string}>}
 */
export async function createPortalSession(customerId) {
  if (!stripe) {
    // Mock portal for demo purposes
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          url: '#mock-portal'
        })
      }, 1000)
    })
  }

  try {
    // In a real app, this would call your backend API
    const response = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        returnUrl: window.location.origin
      })
    })

    const session = await response.json()
    return session
  } catch (error) {
    console.error('Error creating portal session:', error)
    throw error
  }
}

/**
 * Mock subscription upgrade for demo purposes
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export async function mockSubscriptionUpgrade(userId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate successful upgrade
      localStorage.setItem('rightsguard-subscription', JSON.stringify({
        status: 'pro',
        customerId: 'cus_mock_' + userId,
        subscriptionId: 'sub_mock_' + Date.now(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }))
      resolve(true)
    }, 2000)
  })
}

/**
 * Get subscription status from local storage (mock)
 * In a real app, this would fetch from your backend/Supabase
 */
export function getSubscriptionStatus() {
  const stored = localStorage.getItem('rightsguard-subscription')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (error) {
      console.error('Error parsing subscription data:', error)
    }
  }
  
  return {
    status: 'free',
    customerId: null,
    subscriptionId: null,
    currentPeriodEnd: null
  }
}

/**
 * Pricing configuration
 */
export const PRICING = {
  FREE: {
    name: 'Free',
    price: 0,
    features: [
      'Basic rights information',
      '3 AI script generations per month',
      'Basic recording features',
      'Community support'
    ],
    limitations: {
      scriptGenerations: 3,
      recordingDuration: 300, // 5 minutes
      offlineAccess: false
    }
  },
  PRO: {
    name: 'Pro',
    price: 3,
    priceId: 'price_pro_monthly', // This would be your actual Stripe price ID
    features: [
      'All free features',
      'Unlimited AI script generations',
      'Advanced recording features',
      'Offline access to rights cards',
      'Priority support',
      'Shareable incident cards'
    ],
    limitations: {
      scriptGenerations: -1, // unlimited
      recordingDuration: -1, // unlimited
      offlineAccess: true
    }
  }
}
