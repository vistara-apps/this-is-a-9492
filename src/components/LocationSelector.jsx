import React, { useState } from 'react'
import { MapPin, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
]

export default function LocationSelector({ onStateSelect }) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredStates = US_STATES.filter(state =>
    state.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleLocationDetection = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser')
      return
    }

    toast.loading('Detecting your location...')
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // In a real app, you'd use a geocoding service to convert coordinates to state
          // For demo purposes, we'll simulate this
          const mockState = 'California' // Simulated result
          toast.dismiss()
          toast.success('Location detected!')
          onStateSelect(mockState)
        } catch (error) {
          toast.dismiss()
          toast.error('Failed to determine your state')
        }
      },
      (error) => {
        toast.dismiss()
        toast.error('Location access denied. Please select your state manually.')
      },
      { timeout: 10000 }
    )
  }

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <MapPin className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
          Select Your Location
        </h1>
        <p className="text-text-secondary">
          Get accurate, state-specific legal guidance tailored to your location
        </p>
      </div>

      {/* Auto-detect button */}
      <div className="mb-6">
        <button
          onClick={handleLocationDetection}
          className="w-full btn-primary flex items-center justify-center space-x-2"
        >
          <MapPin className="h-5 w-5" />
          <span>Auto-Detect My Location</span>
        </button>
      </div>

      <div className="text-center text-text-secondary text-sm mb-6">
        or select manually
      </div>

      {/* Search input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary" />
        <input
          type="text"
          placeholder="Search for your state..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
        />
      </div>

      {/* States list */}
      <div className="card max-h-96 overflow-y-auto">
        <div className="space-y-1">
          {filteredStates.map((state) => (
            <button
              key={state}
              onClick={() => onStateSelect(state)}
              className="w-full text-left p-3 rounded-md hover:bg-gray-50 transition-colors text-text-primary"
            >
              {state}
            </button>
          ))}
        </div>
        
        {filteredStates.length === 0 && (
          <div className="text-center py-8 text-text-secondary">
            No states found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  )
}