import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { userService } from '../lib/database.js'
import { getSubscriptionStatus, mockSubscriptionUpgrade, PRICING } from '../lib/stripe.js'

const SubscriptionContext = createContext()

export function useSubscription() {
  return useContext(SubscriptionContext)
}

export function SubscriptionProvider({ children }) {
  const [subscriptionStatus, setSubscriptionStatus] = useState('free')
  const [scriptGenerationsUsed, setScriptGenerationsUsed] = useState(0)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const FREE_TIER_LIMIT = PRICING.FREE.limitations.scriptGenerations

  useEffect(() => {
    if (user) {
      loadSubscriptionData()
    } else {
      setSubscriptionStatus('free')
      setScriptGenerationsUsed(0)
      setLoading(false)
    }
  }, [user])

  const loadSubscriptionData = async () => {
    try {
      setLoading(true)
      
      // Get user profile with subscription info
      const userProfile = await userService.getUser(user.id)
      if (userProfile) {
        setSubscriptionStatus(userProfile.subscription_status || 'free')
        setScriptGenerationsUsed(userProfile.script_generations_used || 0)
      }

      // Also check Stripe subscription status
      const stripeStatus = getSubscriptionStatus()
      if (stripeStatus.status === 'pro' && subscriptionStatus !== 'pro') {
        // Update user profile if Stripe shows pro but database doesn't
        await userService.updateUser(user.id, { subscription_status: 'pro' })
        setSubscriptionStatus('pro')
      }
    } catch (error) {
      console.error('Error loading subscription data:', error)
      // Fallback to localStorage for demo
      const savedStatus = localStorage.getItem(`subscription-${user.id}`)
      const savedUsage = localStorage.getItem(`script-usage-${user.id}`)
      
      if (savedStatus) {
        setSubscriptionStatus(savedStatus)
      }
      if (savedUsage) {
        setScriptGenerationsUsed(parseInt(savedUsage))
      }
    } finally {
      setLoading(false)
    }
  }

  const canGenerateScript = () => {
    if (subscriptionStatus === 'pro') return true
    return scriptGenerationsUsed < FREE_TIER_LIMIT
  }

  const incrementScriptUsage = async () => {
    if (subscriptionStatus === 'free' && user) {
      try {
        // Update in database
        const updatedUser = await userService.incrementScriptUsage(user.id)
        if (updatedUser) {
          setScriptGenerationsUsed(updatedUser.script_generations_used)
        }
      } catch (error) {
        console.error('Error incrementing script usage:', error)
        // Fallback to localStorage
        const newUsage = scriptGenerationsUsed + 1
        setScriptGenerationsUsed(newUsage)
        localStorage.setItem(`script-usage-${user.id}`, newUsage.toString())
      }
    }
  }

  const upgradeToPro = async () => {
    if (!user) {
      throw new Error('User must be signed in to upgrade subscription')
    }

    try {
      // Use mock upgrade for demo (in production, this would redirect to Stripe)
      const success = await mockSubscriptionUpgrade(user.id)
      
      if (success) {
        // Update user profile in database
        await userService.updateUser(user.id, { subscription_status: 'pro' })
        setSubscriptionStatus('pro')
        
        // Reload subscription data to get latest info
        await loadSubscriptionData()
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error upgrading subscription:', error)
      throw error
    }
  }

  const cancelSubscription = async () => {
    if (!user) {
      throw new Error('User must be signed in to cancel subscription')
    }

    try {
      // In production, this would call Stripe to cancel the subscription
      // For demo, we'll just update the local state
      await userService.updateUser(user.id, { subscription_status: 'free' })
      setSubscriptionStatus('free')
      
      // Clear Stripe data from localStorage
      localStorage.removeItem('rightsguard-subscription')
      
      return true
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      throw error
    }
  }

  const getUsagePercentage = () => {
    if (subscriptionStatus === 'pro') return 0 // Unlimited
    return Math.min((scriptGenerationsUsed / FREE_TIER_LIMIT) * 100, 100)
  }

  const getRemainingGenerations = () => {
    if (subscriptionStatus === 'pro') return -1 // Unlimited
    return Math.max(FREE_TIER_LIMIT - scriptGenerationsUsed, 0)
  }

  const value = {
    subscriptionStatus,
    scriptGenerationsUsed,
    canGenerateScript,
    incrementScriptUsage,
    upgradeToPro,
    cancelSubscription,
    getUsagePercentage,
    getRemainingGenerations,
    loading,
    FREE_TIER_LIMIT,
    PRICING
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}
