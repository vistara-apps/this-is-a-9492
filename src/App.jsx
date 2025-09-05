import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import AppHeader from './components/AppHeader'
import LocationSelector from './components/LocationSelector'
import RightsCard from './components/RightsCard'
import SubscriptionModal from './components/SubscriptionModal'
import IncidentHistory from './components/IncidentHistory'
import { AuthProvider } from './contexts/AuthContext'
import { SubscriptionProvider } from './contexts/SubscriptionContext'

function App() {
  const [selectedState, setSelectedState] = useState('')
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('rightsguard-selected-state')
    if (savedState) {
      setSelectedState(savedState)
    }
  }, [])

  // Save state to localStorage
  useEffect(() => {
    if (selectedState) {
      localStorage.setItem('rightsguard-selected-state', selectedState)
    }
  }, [selectedState])

  return (
    <AuthProvider>
      <SubscriptionProvider>
        <div className="min-h-screen bg-bg-default">
          <AppHeader onShowSubscription={() => setShowSubscriptionModal(true)} />
          
          <main className="pb-20">
            <Routes>
              <Route path="/" element={
                <div className="max-w-4xl mx-auto px-4 py-6">
                  {!selectedState ? (
                    <LocationSelector onStateSelect={setSelectedState} />
                  ) : (
                    <RightsCard 
                      selectedState={selectedState} 
                      onChangeState={() => setSelectedState('')}
                      onShowSubscription={() => setShowSubscriptionModal(true)}
                    />
                  )}
                </div>
              } />
              <Route path="/history" element={<IncidentHistory />} />
            </Routes>
          </main>

          {showSubscriptionModal && (
            <SubscriptionModal onClose={() => setShowSubscriptionModal(false)} />
          )}
        </div>
      </SubscriptionProvider>
    </AuthProvider>
  )
}

export default App