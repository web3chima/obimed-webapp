import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { contentEditors } from '../access/roles'
import { slugField } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: contentEditors,
    delete: contentEditors,
    read: anyone,
    update: contentEditors,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField({
      position: undefined,
    }),
  ],
}
