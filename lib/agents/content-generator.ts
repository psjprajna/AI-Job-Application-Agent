import { hasOpenAI, openai, MODELS } from './openai-client'
import type { GeneratedContent, Job, ParsedResume } from './types'

const COVER_LETTER_SYSTEM = `You write concise, specific cover letters.
Rules:
- 3 short paragraphs, ~180 words total
- Reference the candidate's most relevant experience to the role
- No filler ("I'm excited to apply"), no superlatives ("I'm passionate")
- Plain prose, no markdown, no greeting like "Dear hiring manager"
- Never invent skills or experience the candidate doesn't have`

const BULLET_SYSTEM = `You rewrite resume bullets to match a job description.
Rules:
- Return 5 bullets, one per line, no numbering
- Each bullet starts with a strong verb
- Preserve facts from the candidate's history — only re-emphasize, never fabricate
- Mirror keywords from the job description when truthful
- Each bullet under 22 words`

export async function generateContent(
  resume: ParsedResume,
  job: Job,
): Promise<GeneratedContent> {
  if (hasOpenAI()) {
    const [letter, bullets] = await Promise.all([
      generateCoverLetterLLM(resume, job),
      generateBulletsLLM(resume, job),
    ])
    return { coverLetter: letter, tailoredBullets: bullets, model: MODELS.fast }
  }
  return {
    coverLetter: templateCoverLetter(resume, job),
    tailoredBullets: templateBullets(resume, job),
    model: 'template',
  }
}

async function generateCoverLetterLLM(
  resume: ParsedResume,
  job: Job,
): Promise<string> {
  const res = await openai().chat.completions.create({
    model: MODELS.fast,
    messages: [
      { role: 'system', content: COVER_LETTER_SYSTEM },
      {
        role: 'user',
        content: buildPrompt(resume, job),
      },
    ],
    temperature: 0.4,
  })
  return res.choices[0]?.message?.content?.trim() ?? ''
}

async function generateBulletsLLM(
  resume: ParsedResume,
  job: Job,
): Promise<string[]> {
  const res = await openai().chat.completions.create({
    model: MODELS.fast,
    messages: [
      { role: 'system', content: BULLET_SYSTEM },
      { role: 'user', content: buildPrompt(resume, job) },
    ],
    temperature: 0.3,
  })
  const content = res.choices[0]?.message?.content?.trim() ?? ''
  return content
    .split(/\n+/)
    .map((l) => l.replace(/^[-•*\d.\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 5)
}

function buildPrompt(resume: ParsedResume, job: Job): string {
  const exp = resume.experience
    .slice(0, 4)
    .map((e) => `- ${e.title} at ${e.company}: ${e.bullets.join('; ')}`)
    .join('\n')
  return `Candidate: ${resume.name ?? 'Candidate'}
Summary: ${resume.summary ?? '(none)'}
Skills: ${resume.skills.join(', ')}
Experience:
${exp}

Job: ${job.title} at ${job.company}
Description:
${job.description.slice(0, 2500)}`
}

function templateCoverLetter(resume: ParsedResume, job: Job): string {
  const recent = resume.experience[0]
  const skillMatch = resume.skills.slice(0, 4).join(', ')
  const recentLine = recent
    ? `Most recently I worked as ${recent.title} at ${recent.company}, where I ${recent.bullets[0]?.toLowerCase() ?? 'shipped work end-to-end'}.`
    : ''

  return [
    `I'm applying for the ${job.title} role at ${job.company}.`,
    `${recentLine} The mix of ${skillMatch || 'relevant tools'} I use day-to-day lines up with what the role asks for.`,
    `Happy to walk through specifics — particularly ${job.tags.slice(0, 2).join(' and ') || 'the parts of the role most relevant to your team'}.`,
  ]
    .filter(Boolean)
    .join('\n\n')
}

function templateBullets(resume: ParsedResume, job: Job): string[] {
  const skillsInJob = resume.skills.filter((s) =>
    job.description.toLowerCase().includes(s.toLowerCase()),
  )
  const recent = resume.experience[0]
  const base = recent?.bullets.slice(0, 5) ?? [
    'Shipped production features end-to-end across frontend and backend.',
    'Owned project scope from spec through deploy in two-week iterations.',
  ]
  if (skillsInJob.length === 0) return base
  return base.map(
    (b, i) =>
      `${b}${i === 0 ? ` (stack: ${skillsInJob.slice(0, 3).join(', ')})` : ''}`,
  )
}
