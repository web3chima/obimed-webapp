import type { RequiredDataFromCollectionSlug } from 'payload'

import { siteConfig } from '@/utilities/siteConfig'

import { customLink, heading, paragraph, richText } from './lexical'

// Company page content from the "OBIMED Website Content Map" (Company page) and brochure.
// The values are drafted from the policy statements (section 1.5) and the services'
// hover text from the content map; have Obimed review both before launch.

export const obimedCompany: RequiredDataFromCollectionSlug<'pages'> = {
  slug: 'company',
  _status: 'published',
  title: 'Company',
  hero: {
    type: 'brandBanner',
    richText: richText(
      heading('h1', 'About OBIMED Pharmaceuticals'),
      paragraph(
        'A trusted pharmaceutical sourcing and supply chain support company, keeping food and pharmaceutical manufacturers across Africa supplied with quality raw materials.',
      ),
    ),
    links: [
      { link: customLink('Request a Quote', '/quote', 'default') },
      { link: customLink('View Products', '/products', 'outline') },
    ],
  },
  layout: [
    {
      blockType: 'aboutIntro',
      eyebrow: 'Who we are',
      heading: 'Sourcing excellence, backed by 30+ years of group experience',
      body: [
        "OBIMED Pharmaceuticals is a trusted pharmaceutical sourcing and supply chain support company, operating as a group with our parent company, KBC Chemical (Janet N Pharmaceutical), which brings over 30 years of industry experience in chemical raw materials marketing, sourcing, procurement operations and distribution to the food and pharmaceutical industries in the African market.",
        'We specialize in the sourcing and supply chain of Active Pharmaceutical Ingredients (APIs), food-grade raw materials, procurement solutions, distribution support and Local Purchase Order (LPO) financing for manufacturers in the pharmaceutical and food industries in Africa.',
        'At OBIMED Pharmaceuticals, we are committed to supporting uninterrupted manufacturing by ensuring timely access to quality raw materials through an efficient and reliable supply chain.',
      ].join('\n\n'),
      listTitle: 'Our operational focus',
      listItems: [
        { text: 'Reliable raw material sourcing' },
        { text: 'API & food-grade material supply' },
        { text: 'Procurement & distribution support' },
        { text: 'Manufacturing uptime optimization' },
        { text: 'Local Purchase Order (LPO) financing' },
        { text: 'Quality-driven supply chain solutions' },
      ],
    },
    {
      blockType: 'missionVision',
      mission:
        'To deliver sourcing excellence by ensuring reliable, timely and consistent access to quality raw materials that support pharmaceutical and food manufacturing objectives.',
      vision:
        'To become a leading player in the African pharmaceutical value chain by supporting local drug and food manufacturers in at least 10 African countries, while making quality raw materials accessible, affordable and consistently available.',
    },
    {
      blockType: 'services',
      eyebrow: 'Services',
      heading: 'How we support your manufacturing',
      intro: 'Hover over a service (or tap on your phone) to see what it covers.',
      items: [
        {
          title: 'Active Pharmaceutical Ingredient (API) Importation',
          description:
            'We facilitate the sourcing and importation of the Active Pharmaceutical Ingredients (APIs) required for pharmaceutical manufacturing.',
        },
        {
          title: 'Food-Grade Raw Material Supply',
          description:
            'We provide reliable access to premium food-grade raw materials that support food processing and manufacturing operations.',
        },
        {
          title: 'Procurement & Strategic Sourcing',
          description:
            'We assist organizations with efficient procurement planning and sourcing strategies tailored to their manufacturing requirements.',
        },
        {
          title: 'Local Purchase Order (LPO) Financing',
          description:
            'We support manufacturing operations through strategic LPO financing solutions that improve procurement flexibility and business continuity.',
        },
        {
          title: 'Distribution Support',
          comingSoon: true,
        },
      ],
    },
    {
      blockType: 'values',
      eyebrow: 'Our values',
      heading: 'What guides every delivery',
      intro:
        'The commitments behind how we source, supply and finance raw materials for our clients.',
      items: [
        {
          title: 'Regulatory compliance',
          icon: 'scale',
          description:
            'We follow the Nigerian laws and guidelines that govern importing and supplying APIs and food-grade raw materials, including NAFDAC, Nigeria Customs Service and SON requirements.',
        },
        {
          title: 'Quality & safety',
          icon: 'shield',
          description:
            'Every material we supply is held to national and international standards for quality, purity and safety, with full traceability from source to delivery.',
        },
        {
          title: 'Integrity',
          icon: 'handshake',
          description:
            'We source and trade with transparency, fairness and ethical conduct, and we expect the same from every partner in our supply chain.',
        },
        {
          title: 'Financial prudence',
          icon: 'wallet',
          description:
            'Our LPO financing is backed by careful credit assessment, clear agreements and sound controls, so every arrangement is secure for both sides.',
        },
        {
          title: 'Operational excellence',
          icon: 'gauge',
          description:
            'We keep improving our processes to deliver on time, at the right cost, through a resilient supply chain that keeps your production running.',
        },
        {
          title: 'Accountability & transparency',
          icon: 'eye',
          description:
            'Clear responsibilities, open communication and accurate, auditable records for every transaction and delivery.',
        },
      ],
    },
    {
      blockType: 'logoStrip',
      heading: 'Trusted by',
      caption:
        'We are trusted by businesses of varying sizes for our consistency, professionalism and commitment to operational excellence.',
      items: [{ name: 'Emzor' }, { name: 'Evans Baroque' }, { name: 'Juhel Nig. Ltd.' }],
    },
    {
      blockType: 'cta',
      richText: richText(
        heading('h2', 'Work with us'),
        paragraph(
          'Partner with OBIMED for on-demand access to raw materials, from importation to local sourcing and LPO financing.',
        ),
      ),
      links: [
        { link: customLink('Request a Quote', '/quote', 'default') },
        { link: customLink('Chat on WhatsApp', `https://wa.me/${siteConfig.whatsapp}`, 'outline') },
      ],
    },
  ],
  meta: {
    title: 'About OBIMED Pharmaceuticals',
    description:
      'OBIMED Pharmaceuticals supplies APIs, excipients and food-grade raw materials to manufacturers in Africa, with procurement support and LPO financing. Part of the KBC Chemical (Janet N Pharmaceutical) group.',
  },
}
