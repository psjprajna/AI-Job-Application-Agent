import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PrismaClient } from '@prisma/client'
import { parseResume } from '../lib/agents/resume-parser'
import { searchJobs } from '../lib/agents/job-search'
import { rankJobs } from '../lib/agents/match-rank'
import { generateContent } from '../lib/agents/content-generator'

const prisma = new PrismaClient()

const DEMO_USER_ID = 'demo-user'
const DEMO_EMAIL = 'demo@local.test'

async function main() {
  console.log('→ seeding demo user, resume, applications')

  await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {},
    create: { id: DEMO_USER_ID, email: DEMO_EMAIL, name: 'Alex Morgan' },
  })

  const rawText = readFileSync(join(process.cwd(), 'data/sample-resume.txt'), 'utf8')
  const { parsed, mode: parseMode } = await parseResume(rawText)
  console.log(`  resume parsed via ${parseMode}: ${parsed.skills.length} skills, ${parsed.experience.length} roles`)

  await prisma.resume.deleteMany({ where: { userId: DEMO_USER_ID } })
  const resume = await prisma.resume.create({
    data: {
      userId: DEMO_USER_ID,
      rawText,
      parsed: JSON.stringify(parsed),
    },
  })

  console.log('→ searching Remotive for "software engineer"')
  const jobs = await searchJobs({ query: 'software engineer', limit: 12 })
  console.log(`  found ${jobs.length} jobs`)

  const { ranked, mode: rankMode } = await rankJobs(parsed, jobs)
  const top = ranked.slice(0, 3)
  console.log(`  ranked via ${rankMode}; top scores: ${top.map((j) => j.score.toFixed(3)).join(', ')}`)

  await prisma.jobApplication.deleteMany({ where: { userId: DEMO_USER_ID } })

  for (const job of top) {
    const { coverLetter, tailoredBullets, model } = await generateContent(parsed, job)
    await prisma.jobApplication.create({
      data: {
        userId: DEMO_USER_ID,
        resumeId: resume.id,
        jobTitle: job.title,
        company: job.company,
        jobUrl: job.url,
        jobDescription: job.description.slice(0, 4000),
        matchScore: job.score,
        coverLetter,
        tailoredResume: tailoredBullets.map((b) => `- ${b}`).join('\n'),
        status: 'generated',
      },
    })
    console.log(`  generated content for ${job.title} @ ${job.company} (${model})`)
  }

  console.log('✓ done')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
