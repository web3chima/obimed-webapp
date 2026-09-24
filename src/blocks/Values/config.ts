import type { Block } from 'payload'

import { brandIconOptions } from '@/components/BrandIcon/options'

export const Values: Block = {
  slug: 'values',
  interfaceName: 'ValuesBlock',
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: 'Our values',
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
          type: 'row',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'icon',
              type: 'select',
              defaultValue: 'shield',
              options: brandIconOptions,
            },
          ],
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
        },
      ],
    },
  ],
  labels: {
    plural: 'Values',
    singular: 'Values',
  },
}
