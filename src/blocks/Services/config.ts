import type { Block } from 'payload'

export const Services: Block = {
  slug: 'services',
  interfaceName: 'ServicesBlock',
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: 'Services',
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
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'Drops down on hover (or tap on phones).',
          },
        },
        {
          name: 'comingSoon',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
  ],
  labels: {
    plural: 'Services',
    singular: 'Services',
  },
}
