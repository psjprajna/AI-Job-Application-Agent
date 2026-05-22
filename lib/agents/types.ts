export type ParsedResume = {
  name: string | null
  email: string | null
  phone: string | null
  links: string[]
  summary: string | null
  skills: string[]
  experience: Array<{
    company: string
    title: string
    start: string | null
    end: string | null
    bullets: string[]
  }>
  education: Array<{
    school: string
    degree: string | null
    end: string | null
  }>
}

export type Job = {
  id: string
  source: string
  title: string
  company: string
  location: string | null
  url: string
  description: string
  publishedAt: string | null
  tags: string[]
}

export type MatchedJob = Job & {
  score: number
  reasons: string[]
}

export type GeneratedContent = {
  coverLetter: string
  tailoredBullets: string[]
  model: string
}

export type AgentMode = 'llm' | 'heuristic'
