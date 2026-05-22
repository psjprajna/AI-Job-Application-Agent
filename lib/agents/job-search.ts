import type { Job } from './types'

type RemotiveJob = {
  id: number
  url: string
  title: string
  company_name: string
  category: string
  job_type: string
  publication_date: string
  candidate_required_location: string
  salary: string
  description: string
  tags: string[]
}

const REMOTIVE_URL = 'https://remotive.com/api/remote-jobs'

export type JobSearchInput = {
  query?: string
  category?: string
  limit?: number
}

export async function searchJobs({
  query,
  category,
  limit = 20,
}: JobSearchInput): Promise<Job[]> {
  const params = new URLSearchParams()
  if (query) params.set('search', query)
  if (category) params.set('category', category)
  params.set('limit', String(Math.min(limit, 50)))

  const res = await fetch(`${REMOTIVE_URL}?${params.toString()}`, {
    headers: { accept: 'application/json' },
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`remotive ${res.status}: ${await res.text()}`)
  const data = (await res.json()) as { jobs: RemotiveJob[] }

  return data.jobs.slice(0, limit).map((j) => ({
    id: `remotive-${j.id}`,
    source: 'remotive',
    title: j.title,
    company: j.company_name,
    location: j.candidate_required_location || null,
    url: j.url,
    description: stripHtml(j.description),
    publishedAt: j.publication_date,
    tags: j.tags ?? [],
  }))
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/(p|div|li|br|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
