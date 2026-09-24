import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
  OrderedListFeature,
  UnorderedListFeature,
} from '@payloadcms/richtext-lexical'

export const LegalDocument: Block = {
  slug: 'legalDocument',
  interfaceName: 'LegalDocumentBlock',
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'lastUpdated',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayOnly' } },
        },
        {
          name: 'version',
          type: 'text',
        },
      ],
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      admin: {
        description: 'Each H2 heading becomes an entry in the table of contents.',
      },
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
          UnorderedListFeature(),
          OrderedListFeature(),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
    },
  ],
  labels: {
    plural: 'Legal Documents',
    singular: 'Legal Document',
  },
}
