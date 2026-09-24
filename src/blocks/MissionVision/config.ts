import type { Block } from 'payload'

export const MissionVision: Block = {
  slug: 'missionVision',
  interfaceName: 'MissionVisionBlock',
  fields: [
    {
      name: 'mission',
      type: 'textarea',
      required: true,
    },
    {
      name: 'vision',
      type: 'textarea',
      required: true,
    },
  ],
  labels: {
    plural: 'Mission & Vision',
    singular: 'Mission & Vision',
  },
}
