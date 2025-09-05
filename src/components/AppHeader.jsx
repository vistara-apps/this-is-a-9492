import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Shield, Menu, X, User, History, Crown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../contexts/SubscriptionContext'
import AuthModal from './AuthModal'

export default function AppHeader({ onShowSubscription }) {
  const [showMenu, setShowMenu] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user, signOut } = useAuth()
  const { subscriptionStatus } = useSubscription()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    setShowMenu(false)
  }

  return (
    <>
      <header className="bg-surface-default shadow-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-text-primary">RightsGuard AI</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                to="/" 
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Rights Guide
              </Link>
              <Link 
                to="/history" 
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/history' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Incident History
              </Link>
              
              {user ? (
                <div className="flex items-center space-x-4">
                  {subscriptionStatus === 'free' && (
                    <button
                      onClick={onShowSubscription}
                      className="flex items-center space-x-1 text-accent hover:text-orange-600 transition-colors"
                    >
                      <Crown className="h-4 w-4" />
                      <span className="text-sm font-medium">Upgrade to Pro</span>
                    </button>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-text-secondary" />
                    <span className="text-sm text-text-secondary">{user.email}</span>
                  </div>
                  
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="btn-primary text-sm"
                >
                  Sign In
                </button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="md:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              {showMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {showMenu && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <nav className="space-y-4">
                <Link 
                  to="/" 
                  className={`block text-sm font-medium transition-colors ${
                    location.pathname === '/' ? 'text-primary' : 'text-text-secondary'
                  }`}
                  onClick={() => setShowMenu(false)}
                >
                  Rights Guide
                </Link>
                <Link 
                  to="/history" 
                  className={`flex items-center space-x-2 text-sm font-medium transition-colors ${
                    location.pathname === '/history' ? 'text-primary' : 'text-text-secondary'
                  }`}
                  onClick={() => setShowMenu(false)}
                >
                  <History className="h-4 w-4" />
                  <span>Incident History</span>
                </Link>
                
                {user ? (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    {subscriptionStatus === 'free' && (
                      <button
                        onClick={() => {
                          onShowSubscription()
                          setShowMenu(false)
                        }}
                        className="flex items-center space-x-2 text-accent hover:text-orange-600 transition-colors"
                      >
                        <Crown className="h-4 w-4" />
                        <span className="text-sm font-medium">Upgrade to Pro</span>
                      </button>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-text-secondary" />
                      <span className="text-sm text-text-secondary">{user.email}</span>
                    </div>
                    
                    <button
                      onClick={handleSignOut}
                      className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setShowAuthModal(true)
                      setShowMenu(false)
                    }}
                    className="btn-primary text-sm w-full"
                  >
                    Sign In
                  </button>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </>
  )
}