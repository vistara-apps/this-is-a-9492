import React from 'react'
import { Square } from 'lucide-react'

export default function ActionFab({ icon: Icon, onClick, className, label }) {
  const handleClick = () => {
    // Add haptic feedback for mobile devices
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
    onClick()
  }

  return (
    <button
      onClick={handleClick}
      className={`fab ${className}`}
      aria-label={label}
      title={label}
    >
      {Icon === 'stop' ? (
        <Square className="h-6 w-6 fill-current" />
      ) : (
        <Icon className="h-6 w-6" />
      )}
    </button>
  )
}