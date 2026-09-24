import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'
import { MailIcon, MapPinIcon, MessageCircleIcon, PhoneIcon } from 'lucide-react'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'
import { formatPhone, siteConfig } from '@/utilities/siteConfig'

const legalLinks = [
  { href: '/quality-compliance', label: 'Quality & Compliance' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
]

export async function Footer() {
  const footerData = await getCachedGlobal('footer', 1)()

  const navItems = footerData?.navItems || []

  return (
    <footer className="mt-auto bg-brand-purple dark:bg-card text-white print:hidden">
      <div className="h-1.5 bg-brand-green" />
      <div className="container py-12 grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.4fr]">
        <div className="flex flex-col gap-4">
          <Link href="/" className="w-fit">
            <Logo variant="white" className="h-12" />
          </Link>
          <p className="text-sm text-white/80 max-w-sm">{siteConfig.description}</p>
          <p className="text-xs font-semibold tracking-wider text-white/80">
            RC: {siteConfig.rcNumber}
          </p>
        </div>

        {navItems.length > 0 && (
          <div>
            <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-white mb-4">
              Company
            </h2>
            <nav className="flex flex-col gap-3 text-sm">
              {navItems.map(({ link }, i) => {
                return <CMSLink className="text-white/80 hover:text-white" key={i} {...link} />
              })}
            </nav>
          </div>
        )}

        <div>
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-white mb-4">
            Contact us
          </h2>
          <ul className="flex flex-col gap-3 text-sm text-white/80">
            <li className="flex gap-3">
              <MapPinIcon className="w-4 shrink-0 text-brand-green" />
              <span>{siteConfig.address}</span>
            </li>
            <li className="flex gap-3">
              <PhoneIcon className="w-4 shrink-0 text-brand-green" />
              <span className="flex flex-wrap gap-x-3 gap-y-1">
                {siteConfig.phones.map((phone) => (
                  <a key={phone} href={`tel:${phone}`} className="hover:text-white">
                    {formatPhone(phone)}
                  </a>
                ))}
              </span>
            </li>
            <li className="flex gap-3">
              <MailIcon className="w-4 shrink-0 text-brand-green" />
              <a href={`mailto:${siteConfig.email}`} className="hover:text-white break-all">
                {siteConfig.email}
              </a>
            </li>
            <li className="flex gap-3">
              <MessageCircleIcon className="w-4 shrink-0 text-brand-green" />
              <a
                href={`https://wa.me/${siteConfig.whatsapp}`}
                className="hover:text-white"
                rel="noopener noreferrer"
                target="_blank"
              >
                Chat on WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="container py-5 flex flex-col-reverse gap-4 md:flex-row md:items-center md:justify-between text-xs text-white/70">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
            <p>
              © {new Date().getFullYear()} {siteConfig.name} All rights reserved.
            </p>
            <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2">
              {legalLinks.map(({ href, label }) => (
                <Link className="hover:text-white" href={href} key={href}>
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="[&_button]:text-white/80 [&_[data-placeholder]]:text-white/80 [&_svg]:text-white/80">
            <ThemeSelector />
          </div>
        </div>
      </div>
    </footer>
  )
}
