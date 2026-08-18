import type { Metadata, Viewport } from 'next';
import { Titillium_Web } from 'next/font/google';
import './globals.css';

import { AuthProvider } from '@/components/auth/AuthProvider';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { CategoryBar } from '@/components/layout/CategoryBar';
import { UspBar } from '@/components/layout/UspBar';
import { Footer } from '@/components/layout/Footer';
import { CookieBanner } from '@/components/layout/CookieBanner';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { getCategoryNav, getReviews } from '@/lib/queries';
import { serverApi } from '@/lib/api.server';
import type { AuthUser } from '@shared/types';

const titillium = Titillium_Web({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  display: 'swap',
  variable: '--font-titillium',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'BAS World: trucks, vans, construction equipment & trailers',
    template: '%s | BAS World',
  },
  description:
    'Buy and sell trucks, tractor units, trailers, commercial vehicles and construction equipment worldwide. Explore 200.000m² of stock at BAS World.',
  openGraph: {
    type: 'website',
    siteName: 'BAS World',
    locale: 'en_GB',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1D1D1A',
};

async function getInitialUser(): Promise<AuthUser | null> {
  try {
    const { user } = await serverApi<{ user: AuthUser | null }>('/api/auth/me', {
      withAuth: true,
      revalidate: 0,
    });
    return user;
  } catch {
    // API unreachable — render the chrome signed-out rather than failing.
    return null;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [categories, reviews, user] = await Promise.all([
    getCategoryNav(),
    getReviews(),
    getInitialUser(),
  ]);

  return (
    <html lang="en" className={titillium.variable}>
      <body>
        <AuthProvider initialUser={user}>
          <div className="flex min-h-screen flex-col">
            <div className="sticky top-0 z-50 bg-white">
              <UspBar reviewCount={reviews.total} reviewAverage={reviews.average} />
              <SiteHeader categories={categories} />
            </div>
            <CategoryBar categories={categories} />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <ChatWidget />
          <CookieBanner />
        </AuthProvider>

        <script
          type="application/ld+json"
          // Organization schema, mirroring the reference site's structured data.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'BAS World',
              url: SITE_URL,
              logo: `${SITE_URL}/resources/icons/logos/logo-desktop.svg`,
              aggregateRating:
                reviews.total > 0
                  ? {
                      '@type': 'AggregateRating',
                      ratingValue: reviews.average,
                      bestRating: '5',
                      ratingCount: reviews.total,
                    }
                  : undefined,
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+31 413 72 83 20',
                contactType: 'customer service',
                areaServed: 'NL',
              },
              sameAs: [
                'https://www.facebook.com/BASWorldplatform',
                'https://www.instagram.com/basworldplatform',
                'https://nl.linkedin.com/company/basworldplatform',
                'https://www.youtube.com/channel/UClawvATEUiiIsleoGQeIlWQ',
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}
