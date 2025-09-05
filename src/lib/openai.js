import OpenAI from 'openai'

const apiKey = import.meta.env.VITE_OPENAI_API_KEY

let openai = null

if (apiKey) {
  openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true // Note: In production, API calls should go through your backend
  })
} else {
  console.warn('OpenAI API key not found. Using mock responses.')
}

/**
 * Generate legal scripts for a specific state and situation
 * @param {string} state - The US state
 * @param {string} language - 'english' or 'spanish'
 * @param {string} situation - Optional specific situation context
 * @returns {Promise<{scriptToSay: string, scriptNotToSay: string}>}
 */
export async function generateLegalScripts(state, language = 'english', situation = '') {
  if (!openai) {
    // Return mock data when API is not available
    return getMockScripts(state, language)
  }

  try {
    const prompt = `You are a legal expert specializing in civil rights during police encounters. Generate specific, actionable scripts for someone in ${state} during a police encounter.

Context: ${situation || 'General police encounter'}
Language: ${language}

Please provide:
1. "What TO Say" - 5 specific phrases that protect their rights
2. "What NOT to Say" - 5 things to avoid saying

Format as JSON with keys "scriptToSay" and "scriptNotToSay". Each should be a string with bullet points.
Keep responses concise, practical, and legally sound for ${state} law.
${language === 'spanish' ? 'Provide responses in Spanish.' : ''}`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a legal expert who provides accurate, state-specific advice for civil rights during police encounters. Always prioritize safety and legal compliance."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.3
    })

    const response = completion.choices[0].message.content
    
    try {
      const parsed = JSON.parse(response)
      return {
        scriptToSay: parsed.scriptToSay || '',
        scriptNotToSay: parsed.scriptNotToSay || ''
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError)
      return getMockScripts(state, language)
    }

  } catch (error) {
    console.error('OpenAI API error:', error)
    return getMockScripts(state, language)
  }
}

/**
 * Translate text to Spanish using OpenAI
 * @param {string} text - Text to translate
 * @returns {Promise<string>}
 */
export async function translateToSpanish(text) {
  if (!openai) {
    return `[Spanish translation of: ${text}]`
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional translator specializing in legal and civil rights terminology. Translate accurately while maintaining the legal meaning."
        },
        {
          role: "user",
          content: `Translate this legal text to Spanish: ${text}`
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    })

    return completion.choices[0].message.content
  } catch (error) {
    console.error('Translation error:', error)
    return `[Spanish translation of: ${text}]`
  }
}

/**
 * Mock scripts for when OpenAI is not available
 */
function getMockScripts(state, language) {
  const englishScripts = {
    scriptToSay: `• "I am exercising my right to remain silent."
• "I do not consent to any searches."
• "Am I free to leave?"
• "I would like to speak to an attorney."
• "I am recording this interaction for my safety."`,
    scriptNotToSay: `• Don't say "I have nothing to hide"
• Don't volunteer information
• Don't argue about your rights
• Don't resist, even if the stop is illegal
• Don't discuss ongoing legal matters`
  }

  const spanishScripts = {
    scriptToSay: `• "Estoy ejerciendo mi derecho a permanecer en silencio."
• "No consiento a ningún registro."
• "¿Soy libre de irme?"
• "Me gustaría hablar con un abogado."
• "Estoy grabando esta interacción por mi seguridad."`,
    scriptNotToSay: `• No digas "No tengo nada que ocultar"
• No ofrezcas información voluntariamente
• No discutas sobre tus derechos
• No resistas, aunque la parada sea ilegal
• No discutas asuntos legales pendientes`
  }

  return language === 'spanish' ? spanishScripts : englishScripts
}
