import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { AboutIntroBlock } from '@/blocks/AboutIntro/Component'
import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FAQBlock } from '@/blocks/FAQ/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { LegalDocumentBlock } from '@/blocks/LegalDocument/Component'
import { LogoStripBlock } from '@/blocks/LogoStrip/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { MissionVisionBlock } from '@/blocks/MissionVision/Component'
import { ServicesBlock } from '@/blocks/Services/Component'
import { SolutionsBlock } from '@/blocks/Solutions/Component'
import { ValuesBlock } from '@/blocks/Values/Component'

const blockComponents = {
  aboutIntro: AboutIntroBlock,
  archive: ArchiveBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  faq: FAQBlock,
  formBlock: FormBlock,
  legalDocument: LegalDocumentBlock,
  logoStrip: LogoStripBlock,
  mediaBlock: MediaBlock,
  missionVision: MissionVisionBlock,
  services: ServicesBlock,
  solutions: SolutionsBlock,
  values: ValuesBlock,
}

// Sections that draw their own full-width background and spacing
const fullBleedBlocks = new Set([
  'aboutIntro',
  'faq',
  'legalDocument',
  'logoStrip',
  'missionVision',
  'services',
  'solutions',
  'values',
])

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            if (Block) {
              return (
                <div className={fullBleedBlocks.has(blockType) ? undefined : 'my-16'} key={index}>
                  {/* @ts-expect-error there may be some mismatch between the expected types here */}
                  <Block {...block} disableInnerContainer />
                </div>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
