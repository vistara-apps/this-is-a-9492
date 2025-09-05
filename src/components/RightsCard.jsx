import React, { useState, useEffect } from 'react'
import { MapPin, RefreshCw, Mic, Video, Share2, FileText, Globe } from 'lucide-react'
import ScriptDisplay from './ScriptDisplay'
import ActionFab from './ActionFab'
import NotificationBanner from './NotificationBanner'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../contexts/SubscriptionContext'
import { fileService, incidentService } from '../lib/database.js'
import toast from 'react-hot-toast'

export default function RightsCard({ selectedState, onChangeState, onShowSubscription }) {
  const [activeTab, setActiveTab] = useState('rights')
  const [language, setLanguage] = useState('english')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingType, setRecordingType] = useState(null) // 'audio' | 'video'
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [recordedChunks, setRecordedChunks] = useState([])
  
  const { user } = useAuth()
  const { subscriptionStatus, canGenerateScript, incrementScriptUsage, FREE_TIER_LIMIT, scriptGenerationsUsed } = useSubscription()

  // Simulated state-specific legal content
  const [legalContent, setLegalContent] = useState({
    rightsInfo: `In ${selectedState}, you have the following rights during police encounters:\n\n• Right to remain silent\n• Right to refuse searches without a warrant\n• Right to ask if you are free to leave\n• Right to record interactions in public\n• Right to an attorney if arrested`,
    scriptToSay: '',
    scriptNotToSay: ''
  })

  const handleGenerateScript = async () => {
    if (!user) {
      toast.error('Please sign in to generate scripts')
      return
    }

    if (!canGenerateScript()) {
      toast.error(`Free users limited to ${FREE_TIER_LIMIT} script generations`)
      onShowSubscription()
      return
    }

    try {
      const loadingToast = toast.loading('Generating AI scripts...')
      
      // Import OpenAI service
      const { generateLegalScripts } = await import('../lib/openai.js')
      
      // Generate scripts using OpenAI
      const scripts = await generateLegalScripts(selectedState, language)
      
      toast.dismiss(loadingToast)
      
      setLegalContent(prev => ({
        ...prev,
        scriptToSay: scripts.scriptToSay,
        scriptNotToSay: scripts.scriptNotToSay
      }))
      
      // Increment usage count
      await incrementScriptUsage()
      toast.success('Scripts generated successfully!')
      
    } catch (error) {
      toast.dismiss()
      toast.error('Failed to generate scripts')
      console.error('Script generation error:', error)
    }
  }

  const startRecording = async (type) => {
    try {
      const constraints = type === 'video' 
        ? { video: true, audio: true }
        : { audio: true }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      const recorder = new MediaRecorder(stream)
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data])
        }
      }
      
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop())
        saveRecording(type)
      }
      
      setMediaRecorder(recorder)
      setRecordingType(type)
      setIsRecording(true)
      recorder.start()
      
      toast.success(`${type} recording started`)
      
    } catch (error) {
      toast.error(`Failed to start ${type} recording`)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      toast.success('Recording stopped')
    }
  }

  const saveRecording = async (type) => {
    if (recordedChunks.length === 0) return
    
    const blob = new Blob(recordedChunks, {
      type: type === 'video' ? 'video/webm' : 'audio/webm'
    })
    
    try {
      const loadingToast = toast.loading('Saving recording...')
      
      // Create file with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `${type}-${timestamp}.webm`
      const file = new File([blob], fileName, { type: blob.type })
      
      // Upload file to storage
      const uploadResult = await fileService.uploadFile(file, 'incident-recordings', user?.id)
      
      // Create incident report
      const incidentData = {
        userId: user?.id,
        timestamp: new Date().toISOString(),
        location: selectedState,
        state: selectedState,
        notes: `${type} recording from ${selectedState}`,
        audioUrl: type === 'audio' ? uploadResult.url : null,
        videoUrl: type === 'video' ? uploadResult.url : null,
        shareCardContent: {
          type: 'recording',
          recordingType: type,
          state: selectedState,
          timestamp: new Date().toISOString()
        }
      }
      
      await incidentService.createIncident(incidentData)
      
      toast.dismiss(loadingToast)
      toast.success('Recording saved successfully!')
      
      // Clear recorded chunks
      setRecordedChunks([])
      
    } catch (error) {
      toast.dismiss()
      toast.error('Failed to save recording')
      console.error('Recording save error:', error)
    }
  }

  const shareRightsCard = async () => {
    const shareData = {
      title: 'RightsGuard AI - Know Your Rights',
      text: `Know your rights in ${selectedState}. Get instant legal guidance with RightsGuard AI.`,
      url: window.location.href
    }
    
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareData.url)
      toast.success('Link copied to clipboard!')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* State Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MapPin className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">{selectedState}</h1>
              <p className="text-sm text-text-secondary">Legal Rights Guide</p>
            </div>
          </div>
          <button
            onClick={onChangeState}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Change State</span>
          </button>
        </div>
      </div>

      {/* Free Tier Usage Banner */}
      {subscriptionStatus === 'free' && (
        <NotificationBanner
          type="info"
          message={`Free tier: ${scriptGenerationsUsed}/${FREE_TIER_LIMIT} AI script generations used`}
          action={
            <button onClick={onShowSubscription} className="text-primary font-medium">
              Upgrade to Pro
            </button>
          }
        />
      )}

      {/* Language Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => setLanguage('english')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              language === 'english'
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('spanish')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              language === 'spanish'
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Español
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => setActiveTab('rights')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'rights'
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Your Rights
          </button>
          <button
            onClick={() => setActiveTab('scripts')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'scripts'
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Globe className="h-4 w-4 inline mr-2" />
            AI Scripts
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'rights' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Your Rights in {selectedState}
          </h2>
          <div className="prose prose-blue max-w-none">
            <pre className="whitespace-pre-wrap text-text-primary font-sans">
              {legalContent.rightsInfo}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'scripts' && (
        <ScriptDisplay
          legalContent={legalContent}
          language={language}
          onGenerateScript={handleGenerateScript}
          canGenerate={canGenerateScript()}
          isSignedIn={!!user}
        />
      )}

      {/* Recording Status */}
      {isRecording && (
        <NotificationBanner
          type="warning"
          message={`Recording ${recordingType}... Tap the stop button when finished.`}
        />
      )}

      {/* Action FABs */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-4">
        <ActionFab
          icon={Share2}
          onClick={shareRightsCard}
          className="bg-blue-500 hover:bg-blue-600"
          label="Share Rights Card"
        />
        
        {isRecording ? (
          <ActionFab
            icon="stop"
            onClick={stopRecording}
            className="bg-red-500 hover:bg-red-600 animate-pulse"
            label="Stop Recording"
          />
        ) : (
          <>
            <ActionFab
              icon={Mic}
              onClick={() => startRecording('audio')}
              className="bg-green-500 hover:bg-green-600"
              label="Record Audio"
            />
            <ActionFab
              icon={Video}
              onClick={() => startRecording('video')}
              className="bg-purple-500 hover:bg-purple-600"
              label="Record Video"
            />
          </>
        )}
      </div>
    </div>
  )
}
