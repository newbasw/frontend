import { SmartImage as Image } from '../ui/SmartImage';
import Link from 'next/link';
import { ChevronDown, Facebook, Instagram, LinkedIn, YouTube } from '../icons';

const COLUMNS = [
  {
    title: 'Buy',
    links: [
      { label: 'View stock', href: '/stock/all' },
      { label: 'Auction — live lots', href: '/auctions' },
      { label: 'How to buy a vehicle', href: '/content/how-to-buy' },
    ],
  },
  {
    title: 'Buy',
    links: [{ label: 'Browse all stock', href: '/stock/all' }],
  },
  {
    title: 'Help',
    links: [
      { label: 'BAS World Store', href: '/content/bas-world-store' },
      { label: 'Contact', href: '/content/contact-us' },
      { label: 'Careers', href: '/content/about-bas-world' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { label: 'About BAS World', href: '/content/about-bas-world' },
      { label: 'News', href: '/news' },
      { label: 'Ethics', href: '/content/ethics' },
    ],
  },
];

const SOCIALS = [
  { label: 'Facebook', href: 'https://www.facebook.com/BASWorldplatform', Icon: Facebook },
  { label: 'YouTube', href: 'https://www.youtube.com/channel/UClawvATEUiiIsleoGQeIlWQ', Icon: YouTube },
  { label: 'Instagram', href: 'https://www.instagram.com/basworldplatform', Icon: Instagram },
  { label: 'LinkedIn', href: 'https://nl.linkedin.com/company/basworldplatform', Icon: LinkedIn },
];

export function Footer() {
  return (
    <footer className="mt-16">
      {/* Decorative curve that lifts the footer into the page, as on the reference. */}
      <div
        aria-hidden="true"
        className="h-[60px] w-full bg-[url('/resources/images/desktop-curve-footer.svg')] bg-cover bg-bottom bg-no-repeat md:h-[99px]"
      />
      <div className="bg-ink text-white">
        <div className="page-wrapper py-8">
          <div className="mb-8">
            <Link href="/" aria-label="BAS World home">
              <Image
                src="/resources/icons/logos/logo-white.svg"
                alt="BAS World"
                width={256}
                height={44}
                className="h-[44px] w-[256px]"
              />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-8 md:grid-cols-4">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="mb-3 text-md font-semibold">{column.title}</p>
                <ul className="space-y-2">
                  {column.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link href={link.href} className="text-base text-grey-450 hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-6 border-t border-white/15 pt-6 md:flex-row md:items-center md:justify-between">
            <button
              type="button"
              className="flex w-fit items-center gap-2 border border-white/30 px-3 py-2 text-base"
            >
              <Image
                src="/resources/icons/flags/en.svg"
                alt=""
                width={20}
                height={14}
                className="h-[14px] w-5 object-cover"
              />
              English
              <ChevronDown size={12} />
            </button>

            <div className="flex flex-col gap-4 md:items-end">
              <div className="flex items-center gap-4">
                {SOCIALS.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-grey-450 hover:text-white"
                  >
                    <Icon size={20} />
                  </a>
                ))}
              </div>
              <Link href="/register" className="text-base text-grey-450 underline hover:text-white">
                Subscribe to our newsletter
              </Link>
              <p className="text-xs text-grey-500">
                <Link href="/content/privacy-disclaimer" className="hover:text-white">
                  Privacy policy
                </Link>{' '}
                |{' '}
                <Link href="/content/cookies" className="hover:text-white">
                  Cookie Policy
                </Link>{' '}
                |{' '}
                <Link href="/content/sitemap" className="hover:text-white">
                  Sitemap
                </Link>{' '}
                © Copyright {new Date().getFullYear()} BAS World
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
