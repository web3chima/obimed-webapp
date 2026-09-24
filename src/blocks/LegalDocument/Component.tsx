import React from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'

import type { LegalDocumentBlock as LegalDocumentBlockProps } from '@/payload-types'

import RichText, { jsxConverters, type NodeTypes } from '@/components/RichText'
import { formatDate } from '@/utilities/format'
import { toKebabCase } from '@/utilities/toKebabCase'

type LexicalNode = { type?: string; tag?: string; text?: string; children?: LexicalNode[] }

const plainText = (node: LexicalNode): string =>
  node.text ?? (node.children || []).map(plainText).join('')

const anchorFor = (text: string) => toKebabCase(text.replace(/[^\w\s-]/g, '').trim())

// H2s get ids so the table of contents can link to them
const legalConverters: JSXConvertersFunction<NodeTypes> = (args) => {
  return {
    ...jsxConverters(args),
    heading: ({ node, nodesToJSX }) => {
      const Tag = node.tag
      const children = nodesToJSX({ nodes: node.children })
      if (Tag !== 'h2') return <Tag>{children}</Tag>
      return (
        <Tag className="scroll-mt-8" id={anchorFor(plainText(node as LexicalNode))}>
          {children}
        </Tag>
      )
    },
  }
}

export const LegalDocumentBlock: React.FC<LegalDocumentBlockProps> = ({
  content,
  lastUpdated,
  version,
}) => {
  const sections = ((content?.root?.children || []) as LexicalNode[])
    .filter((node) => node.type === 'heading' && node.tag === 'h2')
    .map((node) => plainText(node))

  return (
    <section className="py-16 md:py-20">
      <div className="container grid gap-12 lg:grid-cols-[16rem_1fr]">
        <aside className="lg:sticky lg:top-8 self-start">
          {(lastUpdated || version) && (
            <p className="mb-6 text-sm text-muted-foreground">
              {lastUpdated && <>Last updated {formatDate(lastUpdated)}</>}
              {lastUpdated && version && ' · '}
              {version && <>Version {version}</>}
            </p>
          )}
          {sections.length > 1 && (
            <nav aria-label="On this page">
              <p className="mb-3 font-heading text-xs font-bold uppercase tracking-[0.2em] text-brand-green-ink">
                On this page
              </p>
              <ol className="flex flex-col gap-2 border-l-2 border-border text-sm">
                {sections.map((title) => (
                  <li key={title}>
                    <a
                      className="-ml-0.5 block border-l-2 border-transparent pl-4 text-foreground hover:border-primary hover:text-primary"
                      href={`#${anchorFor(title)}`}
                    >
                      {title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </aside>

        <RichText
          className="max-w-3xl mx-0 prose-h2:mt-12 prose-h2:first:mt-0 prose-h2:font-bold prose-h3:font-semibold prose-a:text-primary"
          converters={legalConverters}
          data={content as DefaultTypedEditorState}
          enableGutter={false}
        />
      </div>
    </section>
  )
}
