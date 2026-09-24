import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
} from 'payload'

import { revalidatePath } from 'next/cache'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'

const revalidateCareers: CollectionAfterChangeHook = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) revalidatePath('/careers')
  return doc
}

const revalidateCareersDelete: CollectionAfterDeleteHook = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) revalidatePath('/careers')
  return doc
}

export const Jobs: CollectionConfig<'jobs'> = {
  slug: 'jobs',
  labels: { singular: 'Job', plural: 'Jobs' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['title', 'location', 'isOpen', 'closingDate'],
    useAsTitle: 'title',
  },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'department',
          type: 'text',
        },
        {
          name: 'location',
          type: 'text',
          defaultValue: 'Lagos, Nigeria',
        },
        {
          name: 'employmentType',
          type: 'select',
          defaultValue: 'full-time',
          options: [
            { label: 'Full-time', value: 'full-time' },
            { label: 'Part-time', value: 'part-time' },
            { label: 'Contract', value: 'contract' },
            { label: 'Internship', value: 'internship' },
          ],
        },
      ],
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
    },
    {
      name: 'responsibilities',
      type: 'array',
      admin: { initCollapsed: true },
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'requirements',
      type: 'array',
      admin: { initCollapsed: true },
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'isOpen',
      label: 'Accepting applications',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'closingDate',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly' },
        description: 'The role is hidden after this date.',
      },
    },
  ],
  hooks: {
    afterChange: [revalidateCareers],
    afterDelete: [revalidateCareersDelete],
  },
}
