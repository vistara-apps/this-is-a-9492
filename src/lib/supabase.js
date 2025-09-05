import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not found. Using mock data.')
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Database schema types for TypeScript-like documentation
export const DatabaseTypes = {
  User: {
    userId: 'string (uuid)',
    email: 'string',
    subscriptionStatus: 'string (free|pro)',
    createdAt: 'timestamp',
    scriptGenerationsUsed: 'number',
    lastResetDate: 'timestamp'
  },
  IncidentReport: {
    reportId: 'string (uuid)',
    userId: 'string (uuid)',
    timestamp: 'timestamp',
    location: 'string',
    state: 'string',
    notes: 'text',
    audioUrl: 'string',
    videoUrl: 'string',
    shareCardContent: 'json',
    createdAt: 'timestamp'
  },
  LegalContent: {
    contentId: 'string (uuid)',
    state: 'string',
    rightsInfo: 'text',
    scriptToSay: 'text',
    scriptNotToSay: 'text',
    language: 'string (english|spanish)',
    lastUpdated: 'timestamp'
  }
}
