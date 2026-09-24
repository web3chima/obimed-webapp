import type { RequiredDataFromCollectionSlug } from 'payload'

import { customLink, heading, paragraph, richText } from './lexical'

// Obimed homepage content, taken from the "OBIMED Website Content Map" and brochure.
// FAQ answers are drafts built from that material; have Obimed review them before launch.

export const obimedHome: RequiredDataFromCollectionSlug<'pages'> = {
  slug: 'home',
  _status: 'published',
  title: 'Home',
  hero: {
    type: 'brandSlider',
    richText: richText(
      heading('h1', 'Local Market-Ready Access to Raw Material APIs and Excipients'),
      paragraph(
        'We import, distribute and market Active Pharmaceutical Ingredients, excipients and food-grade raw materials for manufacturers across Nigeria.',
      ),
    ),
    slides: [
      {
        text: "Africa's native pharmaceutical import marketer and distributor, supporting pharma and food manufacturing industries.",
      },
      {
        text: 'Compliant importation, verified local sourcing and delivery straight to your facility.',
      },
      {
        text: 'LPO financing with credit supply within a 15-day timeframe to keep your production moving.',
      },
    ],
    links: [
      { link: customLink('Request a Quote', '/quote', 'default') },
      { link: customLink('Our Solutions', '#solutions', 'outline') },
    ],
  },
  layout: [
    {
      blockType: 'logoStrip',
      heading: 'Trusted by',
      caption:
        'We are trusted by businesses of varying sizes for our consistency, professionalism and commitment to operational excellence.',
      items: [{ name: 'Emzor' }, { name: 'Evans Baroque' }, { name: 'Juhel Nig. Ltd.' }],
    },
    {
      blockType: 'solutions',
      eyebrow: 'Solutions',
      heading: 'Bridging global supply and local production',
      intro:
        'OBIMED Pharmaceuticals is built on a single commitment: supporting the objectives of the pharmaceutical and food industries. We solve your three biggest manufacturing bottlenecks: compliance with supply security, local raw material sourcing, and cash flow backed by flexible financing models that keep operations moving.',
      items: [
        {
          title: 'API & Excipient Importation and Distribution',
          icon: 'globe',
          summary:
            'We handle the complex regulatory requirements of international purchasing, customs clearance and logistics to import and distribute high-grade Active Pharmaceutical Ingredients (APIs) and essential excipients directly to your facility.',
          detail:
            'Eliminate regulatory risk. We ensure compliant documentation, audited manufacturers and consistent batch-to-batch quality to safeguard your formulations.',
          link: customLink('Learn about our global network', '/company'),
        },
        {
          title: 'Local Raw Material Sourcing',
          icon: 'truck',
          summary:
            'When we do not import raw materials, we activate our verified local supplier network to source and deliver high-grade raw materials rapidly, keeping your production lines moving without long lead times.',
          detail:
            "Backed by our parent company's 30+ years of marketing chemical raw materials, our established local network slashes lead times and gives you comparable price analysis.",
          link: customLink('View local capabilities', '/company'),
        },
        {
          title: 'LPO Financing',
          icon: 'wallet',
          summary:
            "Cash flow constraints shouldn't freeze your operations. Structured Local Purchase Order (LPO) financing funds your raw material procurement, with credit supply within a 15-day timeframe, so you can scale production without straining working capital.",
          detail:
            'Unlock growth capacity. Secure your inventory today with flexible credit terms matched to your manufacturing objectives.',
          link: customLink('Explore financing structures', '/terms'),
        },
      ],
    },
    {
      blockType: 'faq',
      eyebrow: 'FAQ',
      heading: 'Questions manufacturers ask us',
      intro:
        'How sourcing, supply and LPO financing work with OBIMED. Need something specific? Our team is a message away.',
      items: [
        {
          question: 'How do I buy an API or excipient in Africa?',
          answer:
            'Send us your requirement (product, grade, quantity and delivery location) through our quote form, WhatsApp or email. We confirm availability and pricing, you issue a Local Purchase Order (LPO), and we handle sourcing, import documentation, customs clearance and delivery to your facility.',
        },
        {
          question: 'Do you have a local network of chemical distributors in Nigeria?',
          answer:
            "Yes. When we are not importing a material directly, we source it through our verified local supplier network, backed by our parent company's 30+ years in chemical raw materials marketing. This shortens lead times and lets us give you comparable price analysis.",
        },
        {
          question: 'How do you supply pharmaceutical raw materials?',
          answer:
            'In three steps. Project plan: our engagement begins with a detailed LPO. Requirement design: we capture your specification, quantity and timeline, and scope the work to meet them. Implementation: we supply your raw materials and sign off a QA checklist for every delivered item.',
        },
        {
          question: 'How does LPO financing work for pharmaceutical and food companies?',
          answer:
            'LPO financing lets you receive raw materials on credit against a confirmed Local Purchase Order, with credit supply within a 15-day timeframe. Eligibility depends on a credit assessment of your business and the underlying order, and every arrangement is set out in a written agreement.',
        },
        {
          question: 'What services do you offer in the pharmaceutical procurement supply chain?',
          answer:
            'API importation, food-grade raw material supply, procurement and strategic sourcing, and LPO financing. Distribution support is coming soon.',
        },
      ],
    },
  ],
  meta: {
    title: 'APIs, Excipients & Food-Grade Raw Materials in Nigeria',
    description:
      'Local market-ready access to raw material APIs, excipients and food-grade ingredients in Nigeria. Importation, local sourcing and LPO financing for pharma and food manufacturers.',
  },
}
