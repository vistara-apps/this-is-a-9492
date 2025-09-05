import React, { useState, useEffect } from 'react'
import { FileText, Play, Download, Trash2, Calendar, MapPin, Loader } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { incidentService, fileService } from '../lib/database.js'
import toast from 'react-hot-toast'

export default function IncidentHistory() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadIncidents()
    } else {
      setIncidents([])
      setLoading(false)
    }
  }, [user])

  const loadIncidents = async () => {
    try {
      setLoading(true)
      const userIncidents = await incidentService.getUserIncidents(user.id)
      setIncidents(userIncidents)
    } catch (error) {
      console.error('Error loading incidents:', error)
      // Fallback to localStorage
      const savedReports = JSON.parse(localStorage.getItem('incident-reports') || '[]')
      const userReports = savedReports.filter(report => report.userId === user.id)
      setIncidents(userReports)
    } finally {
      setLoading(false)
    }
  }

  const deleteIncident = async (incident) => {
    try {
      const loadingToast = toast.loading('Deleting incident...')
      
      // Delete from database
      await incidentService.deleteIncident(incident.report_id || incident.id, user.id)
      
      // Delete associated files if they exist
      if (incident.audio_url && incident.audio_url.includes('storage')) {
        try {
          await fileService.deleteFile(incident.audio_url.split('/').pop())
        } catch (error) {
          console.warn('Could not delete audio file:', error)
        }
      }
      
      if (incident.video_url && incident.video_url.includes('storage')) {
        try {
          await fileService.deleteFile(incident.video_url.split('/').pop())
        } catch (error) {
          console.warn('Could not delete video file:', error)
        }
      }
      
      // Reload incidents
      await loadIncidents()
      
      toast.dismiss(loadingToast)
      toast.success('Incident deleted successfully')
    } catch (error) {
      toast.dismiss()
      toast.error('Failed to delete incident')
      console.error('Delete incident error:', error)
    }
  }

  const downloadIncident = (incident) => {
    // In real app, this would download from Supabase storage
    const link = document.createElement('a')
    link.href = incident.url
    link.download = `incident-${incident.id}.${incident.type === 'video' ? 'webm' : 'webm'}`
    link.click()
    toast.success('Download started')
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <FileText className="h-16 w-16 text-text-secondary mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Sign in to view your incident history
        </h2>
        <p className="text-text-secondary">
          Keep track of all your recorded interactions and documentation.
        </p>
      </div>
    )
  }

  if (incidents.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <FileText className="h-16 w-16 text-text-secondary mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          No incidents recorded yet
        </h2>
        <p className="text-text-secondary">
          Start documenting interactions using the recording features on the main page.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Incident History
        </h1>
        <p className="text-text-secondary">
          Your recorded interactions and documentation
        </p>
      </div>

      <div className="space-y-4">
        {incidents.map((incident) => (
          <div key={incident.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {incident.type === 'video' ? (
                    <Play className="h-5 w-5 text-purple-600" />
                  ) : (
                    <Play className="h-5 w-5 text-green-600" />
                  )}
                  <span className="font-medium text-text-primary capitalize">
                    {incident.type} Recording
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-text-secondary mb-3">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(incident.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{incident.location}</span>
                  </div>
                </div>
                
                <div className="text-sm text-text-secondary">
                  Size: {(incident.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => downloadIncident(incident)}
                  className="p-2 text-text-secondary hover:text-primary transition-colors"
                  title="Download"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={() => deleteIncident(incident.id)}
                  className="p-2 text-text-secondary hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
