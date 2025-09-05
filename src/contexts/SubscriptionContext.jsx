import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const SubscriptionContext = createContext()

export function useSubscription() {
  return useContext(SubscriptionContext)
}

export function SubscriptionProvider({ children }) {
  const { user } = useAuth()
  const [subscriptionStatus, setSubscriptionStatus] = useState('free') // 'free' | 'pro'
  const [scriptGenerationsUsed, setScriptGenerationsUsed] = useState(0)

  const FREE_TIER_LIMIT = 3 // Free users get 3 script generations

  useEffect(() => {
    if (user) {
      // In real app, fetch subscription status from Supabase
      const savedStatus = localStorage.getItem(`subscription-${user.id}`)
      const savedUsage = localStorage.getItem(`script-usage-${user.id}`)
      
      if (savedStatus) {
        setSubscriptionStatus(savedStatus)
      }
      if (savedUsage) {
        setScriptGenerationsUsed(parseInt(savedUsage))
      }
    }
  }, [user])

  const canGenerateScript = () => {
    if (subscriptionStatus === 'pro') return true
    return scriptGenerationsUsed < FREE_TIER_LIMIT
  }

  const incrementScriptUsage = () => {
    if (subscriptionStatus === 'free') {
      const newUsage = scriptGenerationsUsed + 1
      setScriptGenerationsUsed(newUsage)
      if (user) {
        localStorage.setItem(`script-usage-${user.id}`, newUsage.toString())
      }
    }
  }

  const upgradeToPro = async () => {
    // In real app, this would integrate with Stripe
    setSubscriptionStatus('pro')
    if (user) {
      localStorage.setItem(`subscription-${user.id}`, 'pro')
    }
    return true
  }

  const value = {
    subscriptionStatus,
    scriptGenerationsUsed,
    canGenerateScript,
    incrementScriptUsage,
    upgradeToPro,
    FREE_TIER_LIMIT
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}