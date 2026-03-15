/**
 * Thin Gemini wrapper.
 *
 * Uses gemini-1.5-flash with JSON mode so responses are always valid JSON —
 * no regex extraction needed.  The model is fast (~5–15 s for our prompts)
 * and cheap enough for on-demand generation.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

function getClient() {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY is not set')
  return new GoogleGenerativeAI(key)
}

/**
 * Send a prompt, parse the response as JSON, and return it typed as T.
 * Throws on network errors or unparseable responses.
 */
export async function geminiJson<T>(prompt: string): Promise<T> {
  const genAI = getClient()
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  })

  const result = await model.generateContent(prompt)
  const text   = result.response.text()

  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(`Gemini returned non-JSON: ${text.slice(0, 200)}`)
  }
}
