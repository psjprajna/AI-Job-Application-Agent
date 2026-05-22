import { hasOpenAI, openai, MODELS } from './openai-client'
import type { AgentMode, Job, MatchedJob, ParsedResume } from './types'

export async function rankJobs(
  resume: ParsedResume,
  jobs: Job[],
): Promise<{ ranked: MatchedJob[]; mode: AgentMode }> {
  if (jobs.length === 0) return { ranked: [], mode: 'heuristic' }

  if (hasOpenAI()) {
    const ranked = await rankWithEmbeddings(resume, jobs)
    return { ranked, mode: 'llm' }
  }
  return { ranked: rankWithKeywords(resume, jobs), mode: 'heuristic' }
}

async function rankWithEmbeddings(
  resume: ParsedResume,
  jobs: Job[],
): Promise<MatchedJob[]> {
  const resumeText = resumeToText(resume)
  const input = [resumeText, ...jobs.map((j) => jobToText(j))]
  const res = await openai().embeddings.create({
    model: MODELS.embedding,
    input,
  })
  const [resumeVec, ...jobVecs] = res.data.map((d) => d.embedding)

  return jobs
    .map((job, i) => {
      const score = cosine(resumeVec, jobVecs[i])
      return {
        ...job,
        score,
        reasons: keywordOverlap(resume, job).slice(0, 5),
      }
    })
    .sort((a, b) => b.score - a.score)
}

function rankWithKeywords(resume: ParsedResume, jobs: Job[]): MatchedJob[] {
  const resumeTerms = new Set(termsOf(resumeToText(resume)))
  return jobs
    .map((job) => {
      const jobTerms = termsOf(jobToText(job))
      const overlap = jobTerms.filter((t) => resumeTerms.has(t))
      const denom = Math.sqrt(jobTerms.length * resumeTerms.size) || 1
      const score = Math.min(1, overlap.length / denom)
      return {
        ...job,
        score,
        reasons: keywordOverlap(resume, job).slice(0, 5),
      }
    })
    .sort((a, b) => b.score - a.score)
}

function resumeToText(r: ParsedResume): string {
  const parts: string[] = []
  if (r.summary) parts.push(r.summary)
  if (r.skills.length) parts.push(`Skills: ${r.skills.join(', ')}`)
  for (const e of r.experience) {
    parts.push(`${e.title} at ${e.company}. ${e.bullets.join(' ')}`)
  }
  return parts.join('\n')
}

function jobToText(j: Job): string {
  return `${j.title} at ${j.company}. ${j.tags.join(', ')}. ${j.description.slice(0, 1500)}`
}

function termsOf(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#./\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
}

function keywordOverlap(resume: ParsedResume, job: Job): string[] {
  const skills = new Set(resume.skills.map((s) => s.toLowerCase()))
  const jobText = jobToText(job).toLowerCase()
  return [...skills].filter((s) => jobText.includes(s))
}

function cosine(a: number[], b: number[]): number {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom === 0 ? 0 : dot / denom
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'you', 'are', 'our', 'your', 'will', 'this',
  'that', 'have', 'has', 'from', 'they', 'their', 'about', 'into', 'over',
  'were', 'been', 'when', 'where', 'what', 'how', 'why', 'who', 'whom',
  'work', 'team', 'role', 'job', 'company', 'experience', 'years', 'year',
  'position', 'looking', 'hiring', 'candidate', 'opportunity', 'including',
])
