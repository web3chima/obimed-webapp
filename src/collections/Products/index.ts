import type { CollectionConfig } from 'payload'

import { slugField } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'
import { revalidateProduct, revalidateProductDelete } from './hooks/revalidateProduct'

export const productCategoryOptions = [
  { label: 'Excipients', value: 'excipient' },
  { label: 'Food-grade raw materials', value: 'food-grade' },
  { label: 'Active Pharmaceutical Ingredients (APIs)', value: 'api' },
]

export const Products: CollectionConfig<'products'> = {
  slug: 'products',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  defaultPopulate: {
    title: true,
    slug: true,
  },
  admin: {
    defaultColumns: ['title', 'category', 'availability', 'updatedAt'],
    useAsTitle: 'title',
  },
  defaultSort: 'sortOrder',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Overview',
          fields: [
            {
              name: 'shortDescription',
              type: 'textarea',
              required: true,
              admin: {
                description: 'One or two sentences, shown on product cards.',
              },
            },
            {
              name: 'description',
              type: 'textarea',
              admin: {
                description: 'Full description for the product page.',
              },
            },
            {
              name: 'applications',
              type: 'array',
              labels: { singular: 'Application', plural: 'Applications' },
              admin: {
                description: 'Industries that use this product and what for.',
                initCollapsed: true,
              },
              fields: [
                {
                  name: 'industry',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'use',
                  type: 'textarea',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          label: 'Specifications',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'formula',
                  type: 'text',
                  admin: { description: 'e.g. NaHCO₃' },
                },
                {
                  name: 'casNumber',
                  label: 'CAS number',
                  type: 'text',
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'grade',
                  type: 'text',
                  admin: { description: 'e.g. Food grade, BP/USP' },
                },
                {
                  name: 'packaging',
                  type: 'text',
                  defaultValue: '25 kg bags',
                },
                {
                  name: 'origin',
                  type: 'text',
                },
              ],
            },
          ],
        },
        {
          label: 'Media & documents',
          fields: [
            {
              name: 'images',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              admin: {
                description: 'The first image is used on product cards.',
              },
            },
            {
              name: 'documents',
              type: 'array',
              admin: {
                description: 'Downloads such as COA or MSDS (PDF).',
                initCollapsed: true,
              },
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'file',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'category',
      type: 'select',
      options: productCategoryOptions,
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'availability',
      type: 'select',
      defaultValue: 'available',
      options: [
        { label: 'Available', value: 'available' },
        { label: 'Coming soon', value: 'coming-soon' },
      ],
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 100,
      admin: {
        position: 'sidebar',
        description: 'Lower numbers are listed first.',
      },
    },
    slugField(),
  ],
  hooks: {
    afterChange: [revalidateProduct],
    afterDelete: [revalidateProductDelete],
  },
}
