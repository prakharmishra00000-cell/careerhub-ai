// CareerHub AI — Unified resilient AI provider supporting ZAI, OpenAI, Gemini, Groq, and heuristic fallback.

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function generateAICompletion(
  messages: ChatMessage[],
  options?: {
    temperature?: number
    jsonMode?: boolean
  }
): Promise<string> {
  // 1. Try ZAI if available
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: messages.map((m) => ({ role: m.role as any, content: m.content })),
      thinking: { type: 'disabled' },
    })
    const content = completion?.choices?.[0]?.message?.content
    if (typeof content === 'string' && content.trim()) {
      return content.trim()
    }
  } catch {
    // Continue to next provider
  }

  // 2. Try OpenAI / OpenRouter / Groq if keys are present
  const apiKey =
    process.env.OPENAI_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.AI_API_KEY

  const baseUrl = process.env.AI_BASE_URL ||
    (process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' :
     process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' :
     'https://api.openai.com/v1')

  const model = process.env.AI_MODEL ||
    (process.env.GROQ_API_KEY ? 'llama-3.3-70b-versatile' :
     process.env.OPENROUTER_API_KEY ? 'meta-llama/llama-3.3-70b-instruct' :
     'gpt-4o-mini')

  if (apiKey) {
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options?.temperature ?? 0.3,
          ...(options?.jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const text = data?.choices?.[0]?.message?.content
        if (typeof text === 'string' && text.trim()) {
          return text.trim()
        }
      }
    } catch {
      // Continue to next fallback
    }
  }

  // 3. Try Gemini API directly if GEMINI_API_KEY is present
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  if (geminiKey) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`
      const prompt = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')
      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options?.temperature ?? 0.3,
            ...(options?.jsonMode ? { responseMimeType: 'application/json' } : {}),
          },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (typeof text === 'string' && text.trim()) {
          return text.trim()
        }
      }
    } catch {
      // Continue to next fallback
    }
  }

  throw new Error('No AI provider available or configured.')
}
