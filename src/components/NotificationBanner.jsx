import React from 'react'
import { Info, AlertTriangle, CheckCircle, X } from 'lucide-react'

export default function NotificationBanner({ type, message, action, onDismiss }) {
  const getIcon = () => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />
      case 'success':
        return <CheckCircle className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getColorClasses = () => {
    switch (type) {
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'warning':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  return (
    <div className={`border rounded-lg p-4 ${getColorClasses()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getIcon()}
          <span className="text-sm font-medium">{message}</span>
        </div>
        
        <div className="flex items-center space-x-3">
          {action && action}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-current hover:opacity-70 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}