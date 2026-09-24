import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import { BriefcaseIcon, MailIcon, MapPinIcon } from 'lucide-react'

import type { Job } from '@/payload-types'

import { PageBanner } from '@/components/PageBanner'
import { Button } from '@/components/ui/button'
import { siteConfig } from '@/utilities/siteConfig'

export const dynamic = 'force-static'
export const revalidate = 600

const employmentLabels: Record<NonNullable<Job['employmentType']>, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
}

const applyHref = (subject: string) =>
  `mailto:${siteConfig.email}?subject=${encodeURIComponent(subject)}`

export default async function CareersPage() {
  const payload = await getPayload({ config: configPromise })

  const jobs = await payload.find({
    collection: 'jobs',
    limit: 100,
    overrideAccess: false,
    pagination: false,
    where: {
      and: [
        { isOpen: { equals: true } },
        {
          or: [
            { closingDate: { exists: false } },
            { closingDate: { greater_than_equal: new Date().toISOString() } },
          ],
        },
      ],
    },
  })

  return (
    <div className="pt-16 pb-24">
      <PageBanner
        eyebrow="Careers"
        intro="Help us keep Africa's pharmaceutical and food manufacturers supplied with quality raw materials."
        title="Build the supply chain with us"
      />

      <div className="container pt-16">
        {jobs.docs.length > 0 ? (
          <>
            <h2 className="mb-8 text-2xl md:text-3xl font-bold">Open roles</h2>
            <ul className="flex flex-col gap-4">
              {jobs.docs.map((job) => (
                <li key={job.id}>
                  <JobCard job={job} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <BriefcaseIcon className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h2 className="font-heading text-xl font-bold">No open roles right now</h2>
            <p className="mx-auto mt-2 max-w-lg">
              We are always glad to hear from people who care about quality and reliable supply.
              Send us your CV and we will keep it on file for future openings.
            </p>
            <Button asChild className="mt-6" size="lg">
              <a href={applyHref('Open application')}>
                <MailIcon />
                Send your CV
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

const JobCard: React.FC<{ job: Job }> = ({ job }) => (
  <details className="group rounded-2xl border border-border bg-background transition-shadow open:shadow-lg">
    <summary className="flex cursor-pointer list-none flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between [&::-webkit-details-marker]:hidden">
      <div>
        <h3 className="font-heading text-xl font-bold group-hover:text-primary transition-colors">
          {job.title}
        </h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {job.department && <span>{job.department}</span>}
          {job.location && (
            <span className="inline-flex items-center gap-1">
              <MapPinIcon className="h-4 w-4" />
              {job.location}
            </span>
          )}
          {job.employmentType && <span>{employmentLabels[job.employmentType]}</span>}
          {job.closingDate && (
            <span>
              Closes{' '}
              {new Date(job.closingDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'Africa/Lagos',
              })}
            </span>
          )}
        </p>
      </div>
      <span className="font-heading text-sm font-semibold text-primary">
        <span className="group-open:hidden">View role</span>
        <span className="hidden group-open:inline">Hide details</span>
      </span>
    </summary>

    <div className="border-t border-border p-6">
      <p className="max-w-3xl leading-relaxed whitespace-pre-line">{job.summary}</p>
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        {job.responsibilities && job.responsibilities.length > 0 && (
          <div>
            <h4 className="mb-3 font-heading font-bold">What you will do</h4>
            <ul className="list-disc space-y-2 pl-5">
              {job.responsibilities.map((item) => (
                <li key={item.id}>{item.text}</li>
              ))}
            </ul>
          </div>
        )}
        {job.requirements && job.requirements.length > 0 && (
          <div>
            <h4 className="mb-3 font-heading font-bold">What you will bring</h4>
            <ul className="list-disc space-y-2 pl-5">
              {job.requirements.map((item) => (
                <li key={item.id}>{item.text}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <Button asChild className="mt-8" size="lg">
        <a href={applyHref(`Application: ${job.title}`)}>
          <MailIcon />
          Apply by email
        </a>
      </Button>
    </div>
  </details>
)

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Open roles at OBIMED Pharmaceutical Ltd. in Lagos, Nigeria.',
}
