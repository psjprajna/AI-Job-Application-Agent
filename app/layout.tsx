import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Job Application Agent',
  description:
    'A 5-agent pipeline that finds jobs, ranks them against your resume, and writes the application.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // SKIP_CLERK=true lets the landing page render without Clerk for screenshots / previews.
  if (process.env.SKIP_CLERK === 'true') {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    )
  }
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
