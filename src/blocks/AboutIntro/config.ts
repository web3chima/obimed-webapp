import type { Block } from 'payload'

export const AboutIntro: Block = {
  slug: 'aboutIntro',
  interfaceName: 'AboutIntroBlock',
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
    },
    {
      name: 'heading',
      type: 'text',
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Separate paragraphs with a blank line.',
      },
    },
    {
      name: 'listTitle',
      type: 'text',
      defaultValue: 'Our operational focus',
    },
    {
      name: 'listItems',
      type: 'array',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
  labels: {
    plural: 'About Intros',
    singular: 'About Intro',
  },
}
