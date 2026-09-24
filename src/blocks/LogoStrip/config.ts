import type { Block } from 'payload'

export const LogoStrip: Block = {
  slug: 'logoStrip',
  interfaceName: 'LogoStripBlock',
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Trusted by',
    },
    {
      name: 'caption',
      type: 'textarea',
      admin: {
        description: 'Shown when visitors hover the strip.',
      },
    },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      admin: {
        description: 'Only list clients who have agreed to be named.',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Optional. The name is shown as text when there is no logo.',
          },
        },
      ],
    },
  ],
  labels: {
    plural: 'Logo Strips',
    singular: 'Logo Strip',
  },
}
