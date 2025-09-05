import React from 'react'
import { MessageSquare, Sparkles, Lock } from 'lucide-react'

export default function ScriptDisplay({ 
  legalContent, 
  language, 
  onGenerateScript, 
  canGenerate, 
  isSignedIn 
}) {
  const hasScripts = legalContent.scriptToSay && legalContent.scriptNotToSay

  // In a real app, Spanish translations would come from the AI or be pre-translated
  const getLocalizedContent = (content) => {
    if (language === 'spanish' && content) {
      // Mock Spanish translation for demo
      return content.replace(/Right/g, 'Derecho')
        .replace(/remain silent/g, 'permanecer en silencio')
        .replace(/attorney/g, 'abogado')
    }
    return content
  }

  if (!hasScripts) {
    return (
      <div className="space-y-6">
        <div className="card text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            AI-Generated Communication Scripts
          </h3>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            Get personalized scripts on what to say and what not to say during law enforcement encounters
          </p>
          
          {!isSignedIn ? (
            <div className="inline-flex items-center space-x-2 text-text-secondary">
              <Lock className="h-4 w-4" />
              <span>Sign in required to generate scripts</span>
            </div>
          ) : !canGenerate ? (
            <div className="text-text-secondary">
              Free tier limit reached. Upgrade to Pro for unlimited script generation.
            </div>
          ) : (
            <button onClick={onGenerateScript} className="btn-primary">
              <Sparkles className="h-5 w-5 mr-2" />
              Generate AI Scripts
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* What to Say */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <MessageSquare className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-text-primary">
            {language === 'english' ? 'What to Say' : 'Qué Decir'}
          </h3>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <pre className="whitespace-pre-wrap text-text-primary font-sans text-sm leading-relaxed">
            {getLocalizedContent(legalContent.scriptToSay)}
          </pre>
        </div>
      </div>

      {/* What NOT to Say */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <MessageSquare className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold text-text-primary">
            {language === 'english' ? 'What NOT to Say' : 'Qué NO Decir'}
          </h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <pre className="whitespace-pre-wrap text-text-primary font-sans text-sm leading-relaxed">
            {getLocalizedContent(legalContent.scriptNotToSay)}
          </pre>
        </div>
      </div>

      {/* Generate New Scripts */}
      {isSignedIn && canGenerate && (
        <div className="text-center">
          <button onClick={onGenerateScript} className="btn-secondary">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate New Scripts
          </button>
        </div>
      )}
    </div>
  )
}