import type { Block } from 'payload'

import { brandIconOptions } from '@/components/BrandIcon/options'
import { link } from '@/fields/link'

export const Solutions: Block = {
  slug: 'solutions',
  interfaceName: 'SolutionsBlock',
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: 'Solutions',
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
      maxRows: 6,
      admin: {
        initCollapsed: true,
      },
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
              defaultValue: 'globe',
              options: brandIconOptions,
            },
          ],
        },
        {
          name: 'summary',
          type: 'textarea',
          required: true,
          admin: {
            description: 'Always visible.',
          },
        },
        {
          name: 'detail',
          type: 'textarea',
          admin: {
            description: 'Revealed on hover (or tap on phones).',
          },
        },
        link({
          appearances: false,
        }),
      ],
    },
  ],
  labels: {
    plural: 'Solutions',
    singular: 'Solutions',
  },
}
