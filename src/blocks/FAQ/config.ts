import type { Block } from 'payload'

export const FAQ: Block = {
  slug: 'faq',
  interfaceName: 'FAQBlock',
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: 'FAQ',
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
    },
    {
      name: 'intro',
      type: 'textarea',
    },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
        },
        {
          name: 'answer',
          type: 'textarea',
          required: true,
          admin: {
            description: 'Plain text. Also published to search engines as FAQ structured data.',
          },
        },
      ],
    },
  ],
  labels: {
    plural: 'FAQs',
    singular: 'FAQ',
  },
}
