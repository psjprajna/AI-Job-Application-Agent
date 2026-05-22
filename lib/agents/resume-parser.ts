import { z } from 'zod'
import { hasOpenAI, openai, MODELS } from './openai-client'
import type { AgentMode, ParsedResume } from './types'

const ResumeSchema = z.object({
  name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  links: z.array(z.string()).default([]),
  summary: z.string().nullable(),
  skills: z.array(z.string()).default([]),
  experience: z
    .array(
      z.object({
        company: z.string(),
        title: z.string(),
        start: z.string().nullable(),
        end: z.string().nullable(),
        bullets: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  education: z
    .array(
      z.object({
        school: z.string(),
        degree: z.string().nullable(),
        end: z.string().nullable(),
      }),
    )
    .default([]),
})

const SYSTEM_PROMPT = `You extract structured profile data from resume text.
Return strict JSON matching the provided schema. Do not invent details — leave fields null
or arrays empty if the input doesn't contain them. Preserve bullets verbatim.`

export async function parseResume(
  rawText: string,
): Promise<{ parsed: ParsedResume; mode: AgentMode }> {
  if (hasOpenAI()) {
    const res = await openai().chat.completions.create({
      model: MODELS.fast,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Schema fields: name, email, phone, links[], summary, skills[], experience[{company,title,start,end,bullets[]}], education[{school,degree,end}].\n\nResume:\n${rawText}`,
        },
      ],
      temperature: 0,
    })
    const content = res.choices[0]?.message?.content ?? '{}'
    const parsed = ResumeSchema.parse(JSON.parse(content))
    return { parsed, mode: 'llm' }
  }
  return { parsed: heuristicParse(rawText), mode: 'heuristic' }
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/
const URL_RE = /\bhttps?:\/\/[^\s)]+|\b(?:linkedin\.com|github\.com)\/[^\s)]+/gi

const SECTION_HEADERS = {
  experience: /^(?:work\s+)?experience|employment|professional experience$/i,
  education: /^education$/i,
  skills: /^(?:technical\s+)?skills|technologies$/i,
  summary: /^summary|profile|objective$/i,
}

export function heuristicParse(text: string): ParsedResume {
  const lines = text.split(/\r?\n/).map((l) => l.trim())
  const nonEmpty = lines.filter(Boolean)

  const email = text.match(EMAIL_RE)?.[0] ?? null
  const phone = text.match(PHONE_RE)?.[0] ?? null
  const links = Array.from(text.matchAll(URL_RE)).map((m) => m[0])
  const name = nonEmpty[0] && !EMAIL_RE.test(nonEmpty[0]) ? nonEmpty[0] : null

  const sections: Record<string, string[]> = {
    summary: [],
    skills: [],
    experience: [],
    education: [],
  }
  let current: keyof typeof sections | null = null
  for (const line of lines) {
    let matched = false
    for (const [key, re] of Object.entries(SECTION_HEADERS)) {
      if (re.test(line)) {
        current = key as keyof typeof sections
        matched = true
        break
      }
    }
    if (matched) continue
    if (current && line) sections[current].push(line)
  }

  const skills = sections.skills
    .join(', ')
    .split(/[,•·|/]/)
    .map((s) => s.trim())
    .filter((s) => s && s.length < 40)

  const experience = parseExperienceBlock(sections.experience)
  const education = parseEducationBlock(sections.education)

  return {
    name,
    email,
    phone,
    links,
    summary: sections.summary.join(' ').trim() || null,
    skills,
    experience,
    education,
  }
}

function parseExperienceBlock(lines: string[]): ParsedResume['experience'] {
  const entries: ParsedResume['experience'] = []
  let current: ParsedResume['experience'][number] | null = null
  for (const line of lines) {
    if (!line) continue
    const looksLikeHeader = /\d{4}/.test(line) && line.length < 120
    if (looksLikeHeader) {
      if (current) entries.push(current)
      const parts = line.split(/[•|·–—-]/).map((p) => p.trim()).filter(Boolean)
      current = {
        company: parts[0] ?? line,
        title: parts[1] ?? '',
        start: extractYear(line, 0),
        end: extractYear(line, 1),
        bullets: [],
      }
    } else if (current) {
      current.bullets.push(line.replace(/^[-•*]\s*/, ''))
    }
  }
  if (current) entries.push(current)
  return entries
}

function parseEducationBlock(lines: string[]): ParsedResume['education'] {
  const entries: ParsedResume['education'] = []
  for (const line of lines) {
    if (!line) continue
    const year = extractYear(line, 0)
    const parts = line.split(/[•|·–—,]/).map((p) => p.trim()).filter(Boolean)
    entries.push({
      school: parts[0] ?? line,
      degree: parts[1] ?? null,
      end: year,
    })
  }
  return entries
}

function extractYear(line: string, index: number): string | null {
  const years = line.match(/\d{4}/g)
  return years?.[index] ?? null
}
