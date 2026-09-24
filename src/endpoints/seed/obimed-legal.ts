import type { RequiredDataFromCollectionSlug } from 'payload'

import { siteConfig } from '@/utilities/siteConfig'

import { heading, labelled, list, paragraph, richText, text } from './lexical'

// Legal pages. These are DRAFTS written from Obimed's "Import, Supply Chain and Purchase Order
// Financing Policy" and content map. They are seeded unpublished: Obimed's lawyer must review
// them before they are published in the admin.

const LAST_UPDATED = '2026-09-24T00:00:00.000Z'

const banner = (title: string, intro: string): RequiredDataFromCollectionSlug<'pages'>['hero'] => ({
  type: 'brandBanner',
  richText: richText(heading('h1', title), paragraph(intro)),
})

const contactParagraph = paragraph([
  text(`${siteConfig.name} (RC ${siteConfig.rcNumber}), ${siteConfig.address}. Email: `),
  text(siteConfig.email, 'bold'),
  text('.'),
])

export const obimedQuality: RequiredDataFromCollectionSlug<'pages'> = {
  slug: 'quality-compliance',
  _status: 'draft',
  title: 'Quality & Compliance',
  hero: banner(
    'Quality & Compliance',
    'How we keep every API and food-grade raw material we supply compliant, traceable and fit for manufacturing.',
  ),
  layout: [
    {
      blockType: 'legalDocument',
      lastUpdated: LAST_UPDATED,
      version: '1.0',
      content: richText(
        paragraph(
          'OBIMED imports, sources and supplies Active Pharmaceutical Ingredients (APIs) and food-grade raw materials in Nigeria under a written Import, Supply Chain and Purchase Order Financing Policy. This page summarizes the commitments in that policy.',
        ),

        heading('h2', 'Regulatory compliance'),
        paragraph(
          'We follow the Nigerian laws, regulations and guidelines that apply to importing and supplying APIs and food-grade raw materials, including those of:',
        ),
        list([
          labelled(
            'NAFDAC',
            'product registration or pre-import approval and an import permit for each consignment before it ships, and NAFDAC-compliant labeling and packaging.',
          ),
          labelled(
            'Nigeria Customs Service',
            'complete and accurate import documentation, including Form M and the Pre-Arrival Assessment Report (PAAR), correct HS classification and true transaction values.',
          ),
          labelled(
            'Standards Organisation of Nigeria (SON)',
            'SONCAP certification for regulated products and conformity with applicable Nigerian Industrial Standards.',
          ),
        ]),

        heading('h2', 'Supplier qualification'),
        list([
          'Suppliers are evaluated on product quality, regulatory compliance, delivery reliability, financial stability and ethical practices.',
          'Manufacturers of APIs and critical food-grade materials must hold valid international GMP certification or equivalent.',
          'We only buy from suppliers on our Approved Supplier List, and we re-evaluate them at least once a year.',
        ]),

        heading('h2', 'Quality assurance'),
        list([
          'Every consignment comes with the manufacturer’s Certificate of Analysis (COA).',
          'Incoming materials are inspected for quantity, packaging, labeling and conformity with the purchase order.',
          'APIs and critical food-grade materials are tested by accredited laboratories (for example ISO/IEC 17025) to confirm identity, purity and specification.',
          'Every batch is traceable from source to delivery, so it can be identified and recalled quickly if needed.',
          'Non-conforming materials are quarantined and investigated, with corrective and preventive action (CAPA).',
          'We sign off a QA checklist for every item we deliver.',
        ]),

        heading('h2', 'Storage and logistics'),
        paragraph(
          'Materials are stored in NAFDAC-approved warehouses with the temperature, humidity, light and pest controls each product requires. We only use reputable, licensed and insured freight forwarders and logistics providers.',
        ),

        heading('h2', 'Record keeping'),
        paragraph(
          'We keep supplier, purchase, regulatory, shipping, customs and quality records for at least ten (10) years, or longer where the law or a contract requires.',
        ),

        heading('h2', 'Ethical business conduct'),
        paragraph(
          'We conduct procurement with transparency and integrity, protect our clients’ and suppliers’ confidential information, and expect the same standards from every partner acting on our behalf.',
        ),

        heading('h2', 'Governance'),
        paragraph(
          "The policy is owned by OBIMED's Directors, overseen by our parent company, Jenet 'N' Pharmaceuticals, and reviewed at least once a year or whenever regulations change.",
        ),

        heading('h2', 'Questions'),
        paragraph('For copies of certificates or questions about a specific product, contact:'),
        contactParagraph,
      ),
    },
  ],
  meta: {
    title: 'Quality & Compliance',
    description:
      'How OBIMED keeps APIs and food-grade raw materials compliant with NAFDAC, Customs and SON requirements, with supplier qualification, COAs and batch traceability.',
  },
}

export const obimedTerms: RequiredDataFromCollectionSlug<'pages'> = {
  slug: 'terms',
  _status: 'draft',
  title: 'Terms & Conditions',
  hero: banner(
    'Terms & Conditions',
    'The terms that apply to our quotes, orders, deliveries and LPO financing.',
  ),
  layout: [
    {
      blockType: 'legalDocument',
      lastUpdated: LAST_UPDATED,
      version: '1.0',
      content: richText(
        heading('h2', 'About these terms'),
        paragraph(
          `These terms apply to every quote, proforma invoice, order and delivery from ${siteConfig.name} (RC ${siteConfig.rcNumber}) ("OBIMED", "we") to a customer ("you"). If a signed agreement with you says something different, the signed agreement applies.`,
        ),

        heading('h2', 'Quotes and orders'),
        list([
          'Quotes are valid for the period stated on them.',
          'An order is binding once we confirm it in writing, for example with an order acknowledgement or proforma invoice.',
          'Your Purchase Order or Local Purchase Order (LPO) should state the products, specifications, quantities and delivery location.',
        ]),

        heading('h2', 'Prices and payment'),
        list([
          'Prices are as stated on our quote or proforma invoice, in Naira unless otherwise stated.',
          'Prices exclude VAT and other applicable taxes, duties and levies unless the quote says otherwise.',
          'Payment is due on the terms stated on the invoice. If payment is late, we may suspend further supplies until it is made.',
        ]),

        heading('h2', 'Delivery'),
        list([
          'We deliver to the location agreed in the order. Delivery dates are estimates unless we have agreed a fixed date in writing.',
          'Please make sure someone is available to receive and check the goods.',
          'We are not responsible for delays caused by events outside our reasonable control (see Events beyond our control).',
        ]),

        heading('h2', 'Risk and ownership'),
        paragraph(
          'Risk in the goods passes to you on delivery. Ownership of the goods passes to you only when we have received payment in full.',
        ),

        heading('h2', 'Inspection and claims'),
        list([
          'Please inspect the goods on delivery and sign the delivery note and QA checklist.',
          labelled('Quantity or weight', 'tell us in writing within seven (7) days of delivery.'),
          labelled('Quality', 'tell us in writing within fifteen (15) days of delivery.'),
          'Include the batch number, photos and, where possible, samples or test results. If we confirm the goods do not meet the agreed specification, we will replace them, credit you or refund you for the goods concerned.',
          'We are not responsible for loss or damage for which a carrier, insurer or other third party is liable.',
        ]),

        heading('h2', 'Product quality and use'),
        paragraph(
          'We supply goods that conform to the agreed specification and the Certificate of Analysis provided. You are responsible for confirming that the goods suit your intended use and for the compliance of the products you make with them.',
        ),

        heading('h2', 'LPO financing'),
        list([
          'LPO financing is available to eligible customers under a separate written financing agreement.',
          'Eligibility depends on our assessment of your business, creditworthiness and the underlying purchase order.',
          'The financing agreement sets out the credit period, fees, repayment schedule, any security and the consequences of late payment.',
        ]),

        heading('h2', 'Liability'),
        paragraph(
          'Our total liability for any order is limited to the price of the goods concerned. We are not liable for indirect or consequential loss, such as loss of profit or production. Nothing in these terms limits liability that cannot be limited under Nigerian law.',
        ),

        heading('h2', 'Events beyond our control'),
        paragraph(
          'Neither party is responsible for delay or failure caused by events beyond its reasonable control, such as port closures, government action, strikes, epidemics, fire, flood or war. The affected party will notify the other promptly and take reasonable steps to limit the impact.',
        ),

        heading('h2', 'Confidentiality'),
        paragraph(
          'Each party will keep the other’s pricing, commercial terms and business information confidential, except where disclosure is required by law.',
        ),

        heading('h2', 'Governing law and disputes'),
        paragraph(
          'These terms are governed by the laws of the Federal Republic of Nigeria. We will first try to resolve any dispute through good-faith negotiation for 30 days. If that fails, the dispute will be referred to mediation or arbitration in Lagos under the Arbitration and Mediation Act 2023 before any court action, and the courts of Lagos State will have jurisdiction.',
        ),

        heading('h2', 'Changes to these terms'),
        paragraph(
          'We may update these terms from time to time. The version published on this page when we confirm your order applies to that order.',
        ),

        heading('h2', 'Contact'),
        contactParagraph,
      ),
    },
  ],
  meta: {
    title: 'Terms & Conditions',
    description:
      'Terms for quotes, orders, deliveries, claims and LPO financing with OBIMED Pharmaceutical Ltd.',
  },
}

export const obimedPrivacy: RequiredDataFromCollectionSlug<'pages'> = {
  slug: 'privacy',
  _status: 'draft',
  title: 'Privacy Policy',
  hero: banner(
    'Privacy Policy',
    'How we collect, use and protect your personal information, in line with the Nigeria Data Protection Act 2023.',
  ),
  layout: [
    {
      blockType: 'legalDocument',
      lastUpdated: LAST_UPDATED,
      version: '1.0',
      content: richText(
        heading('h2', 'Who we are'),
        paragraph(
          `${siteConfig.name} is the data controller for personal information collected through this website and in the course of our business.`,
        ),
        contactParagraph,

        heading('h2', 'Information we collect'),
        list([
          labelled(
            'Quote and inquiry details',
            'your name, company, phone number, email, delivery location, PO/LPO number, the products you ask about and your messages.',
          ),
          labelled(
            'Order and account information',
            'delivery, invoicing and payment records for orders you place with us.',
          ),
          labelled(
            'LPO financing information',
            'business registration, financial and credit information you provide when applying for financing.',
          ),
          labelled(
            'Website data',
            'your quote basket and theme preference are stored in your own browser and are not sent to us until you send a quote request. Our hosting provider may keep standard technical logs, such as IP addresses, for security.',
          ),
        ]),

        heading('h2', 'How we use it'),
        list([
          'To respond to quotes and inquiries, and to process, deliver and invoice orders.',
          'To assess and manage LPO financing applications and agreements.',
          'To meet our legal, regulatory, tax and record-keeping obligations.',
          'To keep our website and systems secure and improve our services.',
        ]),
        paragraph(
          'We rely on the performance of a contract, compliance with legal obligations, our legitimate business interests and, where required, your consent.',
        ),

        heading('h2', 'Sending requests through WhatsApp or email'),
        paragraph(
          'When you send a quote request through WhatsApp or email, the message is delivered by that service (for example WhatsApp, operated by Meta) under its own privacy policy.',
        ),

        heading('h2', 'Who we share it with'),
        paragraph('We do not sell your personal information. We share it only with:'),
        list([
          'Logistics, warehousing and freight partners who deliver your order.',
          'Banks, financing partners and credit agencies, for payments and LPO financing.',
          'Regulators and authorities such as NAFDAC, the Nigeria Customs Service and tax authorities, where the law requires.',
          'Service providers who host our website and systems, under contracts that protect your data.',
        ]),
        paragraph(
          'Some of these providers may process data outside Nigeria. When they do, we make sure appropriate safeguards are in place as the Nigeria Data Protection Act requires.',
        ),

        heading('h2', 'How long we keep it'),
        paragraph(
          'We keep personal information only as long as needed for the purposes above. Order, financing and regulatory records are kept for at least ten (10) years, as our record-keeping obligations require.',
        ),

        heading('h2', 'How we protect it'),
        paragraph(
          'We use technical and organizational measures, including access controls and encryption, to protect personal information from loss, misuse and unauthorized access.',
        ),

        heading('h2', 'Your rights'),
        paragraph('Under the Nigeria Data Protection Act 2023 you have the right to:'),
        list([
          'Access the personal information we hold about you.',
          'Have inaccurate information corrected, or deleted where there is no reason for us to keep it.',
          'Restrict or object to how we use your information.',
          'Receive your information in a portable format.',
          'Withdraw consent at any time, where we rely on consent.',
          'Complain to the Nigeria Data Protection Commission (NDPC).',
        ]),
        paragraph([
          text('To use any of these rights, email '),
          text(siteConfig.email, 'bold'),
          text('.'),
        ]),

        heading('h2', 'Changes to this policy'),
        paragraph(
          'We may update this policy from time to time. The latest version is always published on this page.',
        ),
      ),
    },
  ],
  meta: {
    title: 'Privacy Policy',
    description:
      'How OBIMED Pharmaceutical Ltd. collects, uses and protects personal information under the Nigeria Data Protection Act 2023.',
  },
}

export const obimedLegalPages = [obimedQuality, obimedTerms, obimedPrivacy]
