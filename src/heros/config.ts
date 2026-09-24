import type { Field } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { linkGroup } from '@/fields/linkGroup'

export const hero: Field = {
  name: 'hero',
  type: 'group',
  fields: [
    {
      name: 'type',
      type: 'select',
      defaultValue: 'lowImpact',
      label: 'Type',
      options: [
        {
          label: 'None',
          value: 'none',
        },
        {
          label: 'Brand Slider',
          value: 'brandSlider',
        },
        {
          label: 'Brand Banner',
          value: 'brandBanner',
        },
        {
          label: 'High Impact',
          value: 'highImpact',
        },
        {
          label: 'Medium Impact',
          value: 'mediumImpact',
        },
        {
          label: 'Low Impact',
          value: 'lowImpact',
        },
      ],
      required: true,
    },
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
      label: false,
    },
    {
      name: 'slides',
      type: 'array',
      admin: {
        condition: (_, { type } = {}) => type === 'brandSlider',
        description: 'Short messages that rotate under the main heading.',
      },
      fields: [
        {
          name: 'text',
          type: 'textarea',
          required: true,
        },
      ],
      maxRows: 5,
    },
    linkGroup({
      overrides: {
        maxRows: 2,
      },
    }),
    {
      name: 'media',
      type: 'upload',
      admin: {
        condition: (_, { type } = {}) => ['highImpact', 'mediumImpact'].includes(type),
      },
      relationTo: 'media',
      required: true,
    },
    {
      name: 'brandMedia',
      label: 'Media',
      type: 'upload',
      admin: {
        condition: (_, { type } = {}) => type === 'brandSlider',
        description: 'Optional product image. A brand graphic is shown when empty.',
      },
      relationTo: 'media',
    },
  ],
  label: false,
}
