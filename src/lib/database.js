import { supabase } from './supabase.js'

/**
 * Database service for RightsGuard AI
 * Handles all data operations with fallback to localStorage when Supabase is not available
 */

// User Management
export const userService = {
  /**
   * Create a new user profile
   */
  async createUser(userData) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .insert([{
            user_id: userData.id,
            email: userData.email,
            subscription_status: 'free',
            script_generations_used: 0,
            last_reset_date: new Date().toISOString(),
            created_at: new Date().toISOString()
          }])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (error) {
        console.error('Error creating user:', error)
        throw error
      }
    } else {
      // Fallback to localStorage
      const user = {
        user_id: userData.id,
        email: userData.email,
        subscription_status: 'free',
        script_generations_used: 0,
        last_reset_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
      localStorage.setItem(`user_${userData.id}`, JSON.stringify(user))
      return user
    }
  },

  /**
   * Get user profile by ID
   */
  async getUser(userId) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error && error.code !== 'PGRST116') throw error
        return data
      } catch (error) {
        console.error('Error fetching user:', error)
        return null
      }
    } else {
      // Fallback to localStorage
      const stored = localStorage.getItem(`user_${userId}`)
      return stored ? JSON.parse(stored) : null
    }
  },

  /**
   * Update user profile
   */
  async updateUser(userId, updates) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .update(updates)
          .eq('user_id', userId)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (error) {
        console.error('Error updating user:', error)
        throw error
      }
    } else {
      // Fallback to localStorage
      const stored = localStorage.getItem(`user_${userId}`)
      if (stored) {
        const user = JSON.parse(stored)
        const updated = { ...user, ...updates }
        localStorage.setItem(`user_${userId}`, JSON.stringify(updated))
        return updated
      }
      return null
    }
  },

  /**
   * Increment script generation usage
   */
  async incrementScriptUsage(userId) {
    const user = await this.getUser(userId)
    if (!user) return null

    // Reset counter if it's a new month
    const lastReset = new Date(user.last_reset_date)
    const now = new Date()
    const shouldReset = lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()

    const updates = shouldReset 
      ? { 
          script_generations_used: 1, 
          last_reset_date: now.toISOString() 
        }
      : { 
          script_generations_used: (user.script_generations_used || 0) + 1 
        }

    return await this.updateUser(userId, updates)
  }
}

// Incident Report Management
export const incidentService = {
  /**
   * Create a new incident report
   */
  async createIncident(incidentData) {
    const incident = {
      report_id: crypto.randomUUID(),
      user_id: incidentData.userId,
      timestamp: incidentData.timestamp || new Date().toISOString(),
      location: incidentData.location || '',
      state: incidentData.state || '',
      notes: incidentData.notes || '',
      audio_url: incidentData.audioUrl || null,
      video_url: incidentData.videoUrl || null,
      share_card_content: incidentData.shareCardContent || null,
      created_at: new Date().toISOString()
    }

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('incident_reports')
          .insert([incident])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (error) {
        console.error('Error creating incident:', error)
        throw error
      }
    } else {
      // Fallback to localStorage
      const incidents = this.getStoredIncidents()
      incidents.push(incident)
      localStorage.setItem('rightsguard-incidents', JSON.stringify(incidents))
      return incident
    }
  },

  /**
   * Get all incidents for a user
   */
  async getUserIncidents(userId) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('incident_reports')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
      } catch (error) {
        console.error('Error fetching incidents:', error)
        return []
      }
    } else {
      // Fallback to localStorage
      const incidents = this.getStoredIncidents()
      return incidents.filter(incident => incident.user_id === userId)
    }
  },

  /**
   * Delete an incident
   */
  async deleteIncident(reportId, userId) {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('incident_reports')
          .delete()
          .eq('report_id', reportId)
          .eq('user_id', userId)

        if (error) throw error
        return true
      } catch (error) {
        console.error('Error deleting incident:', error)
        throw error
      }
    } else {
      // Fallback to localStorage
      const incidents = this.getStoredIncidents()
      const filtered = incidents.filter(incident => 
        incident.report_id !== reportId || incident.user_id !== userId
      )
      localStorage.setItem('rightsguard-incidents', JSON.stringify(filtered))
      return true
    }
  },

  /**
   * Helper to get stored incidents from localStorage
   */
  getStoredIncidents() {
    const stored = localStorage.getItem('rightsguard-incidents')
    return stored ? JSON.parse(stored) : []
  }
}

// Legal Content Management
export const legalContentService = {
  /**
   * Get legal content for a specific state and language
   */
  async getLegalContent(state, language = 'english') {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('legal_content')
          .select('*')
          .eq('state', state)
          .eq('language', language)
          .single()

        if (error && error.code !== 'PGRST116') throw error
        return data
      } catch (error) {
        console.error('Error fetching legal content:', error)
        return null
      }
    } else {
      // Return mock legal content
      return this.getMockLegalContent(state, language)
    }
  },

  /**
   * Save or update legal content
   */
  async saveLegalContent(contentData) {
    const content = {
      content_id: contentData.contentId || crypto.randomUUID(),
      state: contentData.state,
      rights_info: contentData.rightsInfo,
      script_to_say: contentData.scriptToSay,
      script_not_to_say: contentData.scriptNotToSay,
      language: contentData.language || 'english',
      last_updated: new Date().toISOString()
    }

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('legal_content')
          .upsert([content])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (error) {
        console.error('Error saving legal content:', error)
        throw error
      }
    } else {
      // In a real app without Supabase, you might cache this locally
      console.log('Legal content saved (mock):', content)
      return content
    }
  },

  /**
   * Mock legal content for demo purposes
   */
  getMockLegalContent(state, language) {
    const englishContent = {
      content_id: `mock_${state}_${language}`,
      state,
      language,
      rights_info: `In ${state}, you have the following rights during police encounters:\n\n• Right to remain silent\n• Right to refuse searches without a warrant\n• Right to ask if you are free to leave\n• Right to record interactions in public\n• Right to an attorney if arrested\n\nThese rights are protected by the Fourth and Fifth Amendments to the U.S. Constitution and may have additional protections under ${state} state law.`,
      script_to_say: '',
      script_not_to_say: '',
      last_updated: new Date().toISOString()
    }

    const spanishContent = {
      ...englishContent,
      rights_info: `En ${state}, tienes los siguientes derechos durante encuentros policiales:\n\n• Derecho a permanecer en silencio\n• Derecho a rechazar registros sin una orden judicial\n• Derecho a preguntar si eres libre de irte\n• Derecho a grabar interacciones en público\n• Derecho a un abogado si eres arrestado\n\nEstos derechos están protegidos por las Enmiendas Cuarta y Quinta de la Constitución de EE.UU. y pueden tener protecciones adicionales bajo la ley estatal de ${state}.`
    }

    return language === 'spanish' ? spanishContent : englishContent
  }
}

// File Upload Service (for audio/video recordings)
export const fileService = {
  /**
   * Upload a file to Supabase storage
   */
  async uploadFile(file, bucket = 'incident-recordings', folder = 'recordings') {
    if (!supabase) {
      // Mock upload for demo
      return {
        url: `mock://storage/${bucket}/${folder}/${file.name}`,
        path: `${folder}/${file.name}`
      }
    }

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      return {
        url: publicUrl,
        path: filePath
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  },

  /**
   * Delete a file from Supabase storage
   */
  async deleteFile(filePath, bucket = 'incident-recordings') {
    if (!supabase) {
      return true // Mock deletion
    }

    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath])

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      throw error
    }
  }
}
