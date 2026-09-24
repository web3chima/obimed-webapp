// Small builders for Lexical rich text used by the Obimed seed content

type TextFormat = 'bold' | 'italic'

const FORMAT_FLAGS: Record<TextFormat, number> = { bold: 1, italic: 2 }

export const text = (value: string, ...formats: TextFormat[]) => ({
  type: 'text',
  detail: 0,
  format: formats.reduce((flags, f) => flags | FORMAT_FLAGS[f], 0),
  mode: 'normal',
  style: '',
  text: value,
  version: 1,
})

type Inline = ReturnType<typeof text>

const toInline = (content: string | Inline[]) =>
  typeof content === 'string' ? [text(content)] : content

type LexicalNode = { type: string; version: number; [key: string]: unknown }

const base = { direction: 'ltr' as const, format: '' as const, indent: 0, version: 1 }

export const heading = (tag: 'h1' | 'h2' | 'h3', content: string | Inline[]) => ({
  ...base,
  type: 'heading',
  tag,
  children: toInline(content),
})

export const paragraph = (content: string | Inline[]) => ({
  ...base,
  type: 'paragraph',
  textFormat: 0,
  children: toInline(content),
})

export const list = (items: (string | Inline[])[], ordered = false) => ({
  ...base,
  type: 'list',
  listType: ordered ? ('number' as const) : ('bullet' as const),
  start: 1,
  tag: ordered ? ('ol' as const) : ('ul' as const),
  children: items.map((item, i) => ({
    ...base,
    type: 'listitem',
    value: i + 1,
    children: toInline(item),
  })),
})

// "Label: rest of the sentence" with the label in bold
export const labelled = (label: string, rest: string) => [text(`${label}: `, 'bold'), text(rest)]

export const richText = (...children: LexicalNode[]) => ({
  root: { ...base, type: 'root', children },
})

export const customLink = (label: string, url: string, appearance?: 'default' | 'outline') => ({
  type: 'custom' as const,
  label,
  url,
  newTab: false,
  ...(appearance ? { appearance } : {}),
})
