import OpenAI from 'openai'

let _client: OpenAI | null = null

export function hasOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY)
}

export function openai(): OpenAI {
  if (_client) return _client
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY is not set')
  _client = new OpenAI({ apiKey: key })
  return _client
}

export const MODELS = {
  fast: 'gpt-4o-mini',
  embedding: 'text-embedding-3-small',
} as const
