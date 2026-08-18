import type { Metadata } from 'next';
import { SmartImage as Image } from '../components/ui/SmartImage';
import Link from 'next/link';
import { ReviewSlider } from '@/components/home/ReviewSlider';
import { CardSlider } from '@/components/home/CardSlider';
import { Hero } from '@/components/home/Hero';
import { PlanBanner } from '@/components/home/PlanBanner';
import { Reveal } from '@/components/ui/Reveal';
import { articleImage, cmsImage, HOME_MEDIA } from '@/lib/basImages';
import { getArticles, getCategoryNav, getLocations, getReviews } from '@/lib/queries';

export const metadata: Metadata = {
  title: 'BAS World: trucks, vans, construction equipment & trailers',
  description:
    'Buy trucks, tractor units, trailers, commercial vehicles and construction equipment worldwide. Explore 200.000m² of stock at BAS World.',
  alternates: { canonical: '/' },
};

/** Real category photography from the reference homepage. */
const CATEGORY_PHOTO: Record<string, string> = {
  truck: cmsImage(HOME_MEDIA.trucks, 676),
  tractorhead: cmsImage(HOME_MEDIA.tractorUnits, 676),
  light_commercial_vehicle: cmsImage(HOME_MEDIA.commercialVehicles, 676),
  construction_equipment: cmsImage(HOME_MEDIA.machinery, 676),
  'semi-trailer': cmsImage(HOME_MEDIA.trailers, 676),
  trailer: cmsImage(HOME_MEDIA.trailers, 676),
  combination: cmsImage(HOME_MEDIA.farmEquipment, 676),
  various: cmsImage(HOME_MEDIA.farmEquipment, 676),
};

const POPULAR = [
  {
    title: 'Tractor units',
    links: [
      { label: 'Volvo tractor units', href: '/stock/tractorhead/volvo' },
      { label: 'DAF tractor units', href: '/stock/tractorhead/daf' },
      { label: 'Scania tractor units', href: '/stock/tractorhead/scania' },
      { label: 'Mercedes tractor units', href: '/stock/tractorhead/mercedes' },
      { label: 'MAN tractor units', href: '/stock/tractorhead/man' },
      { label: 'More about tractor units', href: '/content/tractor-units' },
    ],
  },
  {
    title: 'Trucks',
    links: [
      { label: 'Volvo trucks', href: '/stock/truck/volvo' },
      { label: 'DAF trucks', href: '/stock/truck/daf' },
      { label: 'Scania trucks', href: '/stock/truck/scania' },
      { label: 'Mercedes trucks', href: '/stock/truck/mercedes' },
      { label: 'MAN trucks', href: '/stock/truck/man' },
      { label: 'More about trucks', href: '/content/trucks' },
    ],
  },
  {
    title: 'Commercial vehicles',
    links: [
      { label: 'Ford commercial vehicles', href: '/stock/light_commercial_vehicle/ford' },
      { label: 'Volkswagen commercial vehicles', href: '/stock/light_commercial_vehicle/volkswagen' },
      { label: 'Fiat commercial vehicles', href: '/stock/light_commercial_vehicle/fiat' },
      { label: 'Mercedes commercial vehicles', href: '/stock/light_commercial_vehicle/mercedes' },
      { label: 'MAN commercial vehicles', href: '/stock/light_commercial_vehicle/man' },
      { label: 'More about commercial vehicles', href: '/content/vans' },
    ],
  },
  {
    title: 'Machinery',
    links: [
      { label: 'Caterpillar equipment', href: '/stock/construction_equipment/caterpillar' },
      { label: 'Terex equipment', href: '/stock/construction_equipment/terex' },
      { label: 'Volvo equipment', href: '/stock/construction_equipment/volvo' },
      { label: 'Hitachi equipment', href: '/stock/construction_equipment/hitachi' },
      { label: 'Liebherr equipment', href: '/stock/construction_equipment/liebherr' },
      { label: 'More about machinery', href: '/content/machinery' },
    ],
  },
  {
    title: 'Semi-trailers',
    links: [
      { label: 'Schmitz semi-trailers', href: '/stock/semi-trailer/schmitz' },
      { label: 'Kögel semi-trailers', href: '/stock/semi-trailer/kogel' },
      { label: 'Krone semi-trailers', href: '/stock/semi-trailer/krone' },
      { label: 'Nooteboom semi-trailers', href: '/stock/semi-trailer/nooteboom' },
      { label: 'Van Hool semi-trailers', href: '/stock/semi-trailer/van_hool' },
      { label: 'More about semi-trailers', href: '/content/semi-trailers' },
    ],
  },
  {
    title: 'Buy',
    links: [
      { label: 'Buy a tractor unit', href: '/stock/tractorhead' },
      { label: 'Buy a truck', href: '/stock/truck' },
      { label: 'Buy a van', href: '/stock/light_commercial_vehicle' },
      { label: 'Buy construction equipment', href: '/stock/construction_equipment' },
      { label: 'Buy a semi-trailer', href: '/stock/semi-trailer' },
      { label: 'Buy a trailer', href: '/stock/trailer' },
    ],
  },
];

export default async function HomePage() {
  const [categories, reviews, articles, locations] = await Promise.all([
    getCategoryNav(),
    getReviews(),
    getArticles(24),
    getLocations(),
  ]);

  const totalStock = categories.reduce((sum, c) => sum + c.vehicle_count, 0);

  return (
    <div className="page-wrapper py-6">
      <Hero totalStock={totalStock} />

      {/* 2 — CTA banners */}
      <Reveal direction="up">
        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <Banner
            kicker="Don’t miss out!"
            title="BAS World Auction"
            body="Bid on vehicles now at competitive auction prices."
            primary={{ label: 'Go to Auction', href: '/auctions' }}
            secondary={{ label: 'Browse live lots', href: '/auctions' }}
            image={cmsImage(HOME_MEDIA.banner, 900)}
          />
          <Banner
            kicker="Directly available"
            title="Brand new. Best deal."
            body={`Over ${totalStock.toLocaleString('en-GB')} vehicles in stock, including brand-new trucks, trailers and commercial vehicles.`}
            primary={{ label: 'Read more', href: '/stock/all?condition=new' }}
            image={cmsImage(HOME_MEDIA.trucks, 900)}
          />
        </section>
      </Reveal>

      {/* 2b — instalment plans */}
      <Reveal direction="up">
        <PlanBanner />
      </Reveal>

      {/* 3 — logistics CTA with side image */}
      <Reveal direction="up">
        <CtaWithImage
          eyebrow="Your route. Your deal."
          title="Discover BAS World Logistics"
          body="The free platform for transporters to find jobs, reduce empty kilometres and get paid fast."
          cta={{ label: 'Learn more', href: '/content/about-bas-world' }}
          image={cmsImage(HOME_MEDIA.yard, 900)}
        />
      </Reveal>

      {/* 4 — reviews */}
      <Reveal direction="up">
        <section className="mt-12">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-2xl font-semibold">Why we go above and beyond</h2>
              <p className="text-base text-grey-800">See what users say about us.</p>
            </div>
            <p className="text-base">
              <strong>Excellent</strong> · {reviews.average} out of 5 · {reviews.total} reviews
            </p>
          </div>
          <ReviewSlider reviews={reviews.items} />
        </section>
      </Reveal>

      {/* 5 — locations */}
      <Reveal direction="up">
        <CtaWithImage
          eyebrow="Our locations"
          title="Find your nearest BAS World location"
          body={
            locations.length > 0
              ? locations.map((l) => `${l.name} — ${l.city}`).join(' · ')
              : 'Visit us in Veghel, Barcelona, Linz or Poznań.'
          }
          cta={{ label: 'Read more', href: '/content/contact-us' }}
          image={cmsImage(HOME_MEDIA.store, 900)}
          reverse
        />
      </Reveal>

      {/* 6 — store banners */}
      <Reveal direction="up">
        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <Banner
            kicker="Europe’s largest stock located in Veghel"
            title="Plan a visit to our BAS World Store"
            body="200.000m² of trucks, trailers, vans and machines — all in one place."
            primary={{ label: 'Plan a visit', href: '/content/bas-world-store' }}
            image={cmsImage(HOME_MEDIA.workshop, 900)}
          />
          <Banner
            kicker="Leading the change in global trade"
            title="Learn more about BAS World"
            body="Making international trade in vehicles and machinery easy and safe."
            primary={{ label: 'Learn more', href: '/content/about-bas-world' }}
            image={cmsImage(HOME_MEDIA.team, 900)}
          />
        </section>
      </Reveal>

      {/* 7 — browse by category */}
      <Reveal direction="up">
        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-semibold">Browse by category</h2>
          <CardSlider
            items={categories.map((c) => ({
              key: c.slug,
              title: c.label,
              excerpt: `${c.vehicle_count.toLocaleString('en-GB')} ${c.label.toLowerCase()} in stock right now.`,
              href: `/stock/${c.slug}`,
              image: CATEGORY_PHOTO[c.slug]!,
            }))
            // Only categories we have a real photo for.
            .filter((item) => item.image)}
          />
        </section>
      </Reveal>

      {/* 8 — get in touch */}
      <Reveal direction="up">
        <CtaWithImage
          eyebrow="Get in touch"
          title="We are happy to help"
          body="Contact us via phone or start a chat. Our team speaks 17 languages."
          cta={{ label: 'Contact us', href: '/content/contact-us' }}
          image={cmsImage(HOME_MEDIA.tractorUnits, 900)}
        />
      </Reveal>

      {/* 9 — news */}
      <Reveal direction="up">
        {articles.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-2xl font-semibold">Latest news &amp; articles</h2>
            <CardSlider
              // Only articles backed by a real BAS World photograph.
              items={articles.flatMap((a) => {
                const image = articleImage(a.slug);
                return image
                  ? [{
                      key: a.slug,
                      title: a.title,
                      excerpt: a.excerpt ?? '',
                      href: `/content/${a.slug}`,
                      image,
                    }]
                  : [];
              })}
            />
            <Link href="/news" className="cds-link mt-4 inline-block">
              All news &amp; articles
            </Link>
          </section>
        )}
      </Reveal>

      {/* 10 — popular categories */}
      <Reveal direction="up">
        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-semibold">Popular categories</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {POPULAR.map((column) => (
              <div key={column.title}>
                <p className="mb-2 text-md font-semibold">{column.title}</p>
                <ul className="space-y-1">
                  {column.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link href={link.href} className="text-base text-grey-800 hover:text-ink hover:underline">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

    </div>
  );
}

function HeroTile({
  eyebrow,
  cta,
  href,
  image,
  large,
}: {
  eyebrow: string;
  cta: string;
  href: string;
  image: string;
  large?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex min-h-[200px] items-end overflow-hidden bg-ink ${
        large ? 'md:min-h-[400px] md:row-span-2 md:col-span-1' : 'md:min-h-[192px]'
      }`}
    >
      <Image
        src={image}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 400px"
        priority={large}
        className="object-cover opacity-70 transition-transform duration-500 group-hover:scale-105"
      />
      <div className="relative z-10 p-5 text-white">
        <p className="text-md font-semibold uppercase tracking-wide">{eyebrow}</p>
        <span className="mt-3 inline-block border-b-2 border-brand pb-1 text-base font-semibold">
          {cta}
        </span>
      </div>
    </Link>
  );
}

function Banner({
  kicker,
  title,
  body,
  primary,
  secondary,
  image,
}: {
  kicker: string;
  title: string;
  body: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  image: string;
}) {
  return (
    <article className="flex flex-col overflow-hidden border border-grey-300">
      <div className="relative aspect-[16/9] w-full bg-grey-100">
        <Image src={image} alt="" fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">{kicker}</p>
        <h3 className="mt-1 text-xl font-semibold">{title}</h3>
        <p className="mt-2 flex-1 text-base text-grey-800">{body}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={primary.href} className="bw-btn-black">
            {primary.label}
          </Link>
          {secondary && (
            <Link href={secondary.href} className="bw-btn-outline">
              {secondary.label}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function CtaWithImage({
  eyebrow,
  title,
  body,
  cta,
  image,
  reverse,
}: {
  eyebrow: string;
  title: string;
  body: string;
  cta: { label: string; href: string };
  image: string;
  reverse?: boolean;
}) {
  return (
    <section
      className={`mt-10 flex flex-col overflow-hidden border border-grey-300 md:flex-row ${
        reverse ? 'md:flex-row-reverse' : ''
      }`}
    >
      <div className="relative aspect-[16/9] w-full bg-grey-100 md:aspect-auto md:w-1/2">
        <Image src={image} alt="" fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" />
      </div>
      <div className="flex w-full flex-col justify-center p-6 md:w-1/2 md:p-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-semibold">{title}</h2>
        <p className="mt-2 text-base text-grey-800">{body}</p>
        <Link href={cta.href} className="bw-btn-black mt-5 w-fit">
          {cta.label}
        </Link>
      </div>
    </section>
  );
}
