import React, { useState } from 'react'
import { X, Crown, Check, CreditCard } from 'lucide-react'
import { useSubscription } from '../contexts/SubscriptionContext'
import toast from 'react-hot-toast'

export default function SubscriptionModal({ onClose }) {
  const [loading, setLoading] = useState(false)
  const { upgradeToProas } = useSubscription()

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      // In real app, this would integrate with Stripe
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate payment
      await upgradeToProas()
      toast.success('Upgraded to Pro successfully!')
      onClose()
    } catch (error) {
      toast.error('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const proFeatures = [
    'Unlimited AI script generation',
    'Advanced recording features',
    'Offline access to rights guides',
    'Priority customer support',
    'Export incident reports',
    'Multi-language script translation'
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface-default rounded-xl shadow-modal w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Crown className="h-6 w-6 text-accent" />
            <h2 className="text-xl font-semibold text-text-primary">
              Upgrade to Pro
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Pricing */}
          <div className="text-center mb-6">
            <div className="inline-flex items-baseline space-x-1">
              <span className="text-3xl font-bold text-text-primary">$3</span>
              <span className="text-text-secondary">/month</span>
            </div>
            <p className="text-sm text-text-secondary mt-1">
              Cancel anytime. 7-day free trial.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {proFeatures.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-text-primary">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <CreditCard className="h-5 w-5" />
            <span>{loading ? 'Processing...' : 'Start Free Trial'}</span>
          </button>

          <p className="text-xs text-text-secondary text-center mt-4">
            By upgrading, you agree to our Terms of Service and Privacy Policy.
            You'll be charged $3/month after your 7-day free trial ends.
          </p>
        </div>
      </div>
    </div>
  )
}