import type { Metadata } from 'next';
import { SmartImage as Image } from '../../../../components/ui/SmartImage';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Gallery } from '@/components/vehicle/Gallery';
import { SpecificationTable } from '@/components/vehicle/SpecificationTable';
import { InquiryForm } from '@/components/vehicle/InquiryForm';
import { ReferenceCopy } from '@/components/vehicle/ReferenceCopy';
import { VehicleActions } from '@/components/vehicle/VehicleActions';
import { TrustpilotSummary } from '@/components/ui/Trustpilot';
import { AuctionPanel } from '@/components/auction/AuctionPanel';
import { PaymentPanel } from '@/components/payment/PaymentPanel';
import { PlanStarter } from '@/components/plan/PlanStarter';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { BadgeCheck, Building, CirclePhone } from '@/components/icons';
import { getRelatedVehicles, getReviews, getVehicle } from '@/lib/queries';
import { formatPrice, pdpHeadSpecs } from '@/lib/format';

interface Params {
  params: { condition: string; slug: string };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const vehicle = await getVehicle(params.slug);
  if (!vehicle) return { title: 'Vehicle not found' };

  const price = formatPrice(vehicle.price_cents);
  const description = [
    vehicle.title,
    vehicle.registration_year ? `${vehicle.registration_year}` : null,
    vehicle.mileage_km ? `${vehicle.mileage_km.toLocaleString('en-GB')} km` : null,
    vehicle.emission_norm,
    price,
  ]
    .filter(Boolean)
    .join(' · ');

  const path = `/vehicles/${vehicle.condition === 'new' ? 'new' : 'used'}/${vehicle.slug}`;

  return {
    title: `${vehicle.title} — ${vehicle.reference}`,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: vehicle.title,
      description,
      type: 'website',
      url: path,
      images: vehicle.primary_image ? [{ url: vehicle.primary_image.url }] : undefined,
    },
  };
}

export default async function VehiclePage({ params }: Params) {
  const vehicle = await getVehicle(params.slug);
  if (!vehicle) notFound();

  const [related, reviews] = await Promise.all([
    getRelatedVehicles(params.slug),
    getReviews(),
  ]);
  const price = formatPrice(vehicle.price_cents);
  const priceBefore = formatPrice(vehicle.price_before_cents);
  const auctionPrice = formatPrice(vehicle.auction_price_cents);
  const headSpecs = pdpHeadSpecs(vehicle);
  const isPartner = vehicle.seller_full?.kind === 'trusted_partner';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    name: vehicle.title,
    description: vehicle.description ?? undefined,
    vehicleModelDate: vehicle.production_date ?? undefined,
    vehicleConfiguration: vehicle.axle_configuration ?? undefined,
    vehicleTransmission: vehicle.transmission ?? undefined,
    vehicleEngine: vehicle.power_type
      ? { '@type': 'EngineSpecification', name: `${vehicle.power_type} ${vehicle.emission_norm ?? ''}`.trim() }
      : undefined,
    brand: vehicle.brand ? { '@type': 'Brand', name: vehicle.brand.label } : undefined,
    image: vehicle.images.slice(0, 5).map((i) => i.url),
    sku: vehicle.reference,
    mpn: vehicle.reference,
    productID: vehicle.reference,
    mileageFromOdometer: vehicle.mileage_km
      ? { '@type': 'QuantitativeValue', value: vehicle.mileage_km, unitCode: 'KMT' }
      : undefined,
    offers: {
      '@type': 'Offer',
      price: vehicle.price_cents ? (vehicle.price_cents / 100).toFixed(2) : '0.00',
      priceCurrency: 'EUR',
      availability:
        vehicle.status === 'online' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      itemCondition:
        vehicle.condition === 'new'
          ? 'https://schema.org/NewCondition'
          : 'https://schema.org/UsedCondition',
    },
  };

  return (
    <div className="page-wrapper py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/*
        Head. The reference shows no breadcrumb here — it goes straight to the
        title, then the subtitle and the spec pills on one wrapping line, with
        the share/save actions floated right.
      */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-semibold leading-[38px]">{vehicle.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {vehicle.subtitle && (
              <p className="mr-2 text-lg text-grey-800">{vehicle.subtitle}</p>
            )}
            {headSpecs.map((spec, i) => (
              <span key={spec + i} className="bw-spec-pill">
                {spec}
              </span>
            ))}
          </div>
        </div>
        <VehicleActions
          vehicleId={vehicle.id}
          title={vehicle.title}
          reference={vehicle.reference}
          isFavorite={vehicle.is_favorite ?? false}
        />
      </header>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* ---------- left column (730px) ---------- */}
        <div className="min-w-0 flex-1 lg:max-w-[730px]">
          <Gallery
            images={vehicle.images}
            title={vehicle.title}
            isNew={vehicle.condition === 'new'}
          />

          {vehicle.description && (
            <section className="mt-8">
              <h2 className="mb-2 text-xl font-semibold">Description</h2>
              <p className="whitespace-pre-line text-base text-grey-800">{vehicle.description}</p>
            </section>
          )}

          <SpecificationTable specifications={vehicle.specifications} />

          {vehicle.features.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-xl font-semibold">What does this vehicle offer</h2>
              <ul className="flex flex-wrap gap-2">
                {vehicle.features.map((feature) => (
                  <li
                    key={feature.id}
                    className="border border-grey-400 px-3 py-1 text-base text-ink"
                  >
                    {feature.label}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {isPartner && (
            <section className="mt-8 border border-grey-300 p-6">
              <h2 className="mb-4 text-xl font-semibold">Information about the seller</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-md font-semibold">
                    <BadgeCheck size={16} className="text-brand" />
                    Trusted Selling Partner
                  </h3>
                  <p className="text-base text-grey-800">
                    This vehicle is offered by one of our professional partners. We have personally
                    been in contact with this seller and verified their company identity and
                    location. This ensures that you are dealing with a reliable party, verified by
                    BAS World.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 text-md font-semibold">What does this mean for you?</h3>
                  <p className="text-base text-grey-800">
                    For this vehicle, you have direct contact with the seller for all your
                    questions, negotiations, and the final transaction. By communicating directly
                    with the seller, you receive first-hand information about the vehicle&rsquo;s
                    history and technical specifications.
                  </p>
                </div>
              </div>
              <Link href="/content/about-bas-world" className="cds-link mt-4 inline-block">
                Learn more about our platform
              </Link>
            </section>
          )}
        </div>

        {/* ---------- right column (487px, sticky) ---------- */}
        <aside className="w-full shrink-0 lg:w-[447px]">
          <div className="lg:sticky lg:top-[152px] lg:max-h-[calc(100vh-172px)] lg:overflow-y-auto">
            {/*
              Price block. Measured on the reference: "Buy" and the struck-out
              original sit on one line, the live price is 28px/600 in #D13535
              when discounted, and the two CTAs sit side by side — amber
              "Request offer" and dark-green "Configure now".
            */}
            <div className="border border-grey-300 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-3 text-base text-grey-800">
                    Buy
                    {priceBefore && (
                      <span className="font-semibold text-ink line-through">{priceBefore}</span>
                    )}
                  </p>
                  <p
                    className={`mt-1 text-3xl font-semibold leading-9 ${
                      priceBefore ? 'text-sale' : 'text-ink'
                    }`}
                  >
                    {price ?? 'Price on request'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base text-grey-800">Reference no.</p>
                  <p className="text-md font-medium">{vehicle.reference}</p>
                </div>
              </div>

              {auctionPrice && (
                <p className="mt-1 text-xs text-grey-800">Auction price from {auctionPrice}</p>
              )}
              <p className="mt-1 text-xs text-grey-800">
                {vehicle.vat_deductible ? 'Excl. VAT · VAT deductible' : 'Margin scheme · no VAT'}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <a href="#inquiry" className="bw-btn-cta w-full">
                  Request offer
                </a>
                <a href="#inquiry" className="bw-btn-cta-green w-full">
                  Configure now
                </a>
              </div>

              <div className="mt-4 border-t border-grey-300 pt-4">
                <TrustpilotSummary rating={reviews.average} count={reviews.total} />
              </div>

              <div className="mt-4 border-t border-grey-300 pt-3">
                <ReferenceCopy reference={vehicle.reference} />
              </div>
            </div>

            {/* Seller block */}
            {vehicle.seller_full && (
              <div className="mt-4 border border-grey-300 p-4">
                <p className="text-xs text-grey-800">Offered by</p>
                <p className="mt-1 flex items-center gap-2 text-md font-semibold">
                  <Building size={14} />
                  {vehicle.seller_full.name}
                </p>
                {vehicle.country && (
                  <p className="mt-1 flex items-center gap-2 text-base text-grey-800">
                    <Image
                      src={vehicle.country.flag_path}
                      alt=""
                      width={16}
                      height={12}
                      className="h-3 w-4 object-cover"
                    />
                    {vehicle.country.name}
                  </p>
                )}
                {vehicle.seller_full.is_trusted && (
                  <p className="mt-2 flex items-center gap-1 text-base text-brand">
                    <BadgeCheck size={14} />
                    Trusted selling partner
                  </p>
                )}
                {isPartner && (
                  <p className="mt-2 text-base text-grey-800">
                    This vehicle is offered by an external seller. You will be in direct contact
                    with the seller for questions and next steps.
                  </p>
                )}
                {vehicle.seller_full.phone && (
                  <a
                    href={`tel:${vehicle.seller_full.phone.replace(/\s/g, '')}`}
                    className="mt-3 flex items-center gap-2 text-md font-semibold hover:underline"
                  >
                    <CirclePhone size={16} className="text-brand" />
                    {vehicle.seller_full.phone}
                  </a>
                )}
              </div>
            )}

            {/* Buy outright. Paid by transfer/Zelle/crypto — never by card. */}
            <div className="mt-4">
              <PaymentPanel
                vehicleId={vehicle.id}
                priceCents={vehicle.price_cents}
                title={vehicle.title}
              />
            </div>

            {/* Or spread the cost, with delivery once half has cleared. */}
            <div className="mt-4">
              <PlanStarter vehicleId={vehicle.id} priceCents={vehicle.price_cents} />
            </div>

            {/* Or make an offer — negotiates against the seller's floor price. */}
            <div className="mt-4">
              <AuctionPanel vehicleId={vehicle.id} vehicleTitle={vehicle.title} />
            </div>

            {/* Enquiry */}
            <div id="inquiry" className="mt-4 rounded-minimal border border-grey-300 p-4">
              <InquiryForm
                vehicleId={vehicle.id}
                vehicleTitle={vehicle.title}
                kind="offer_request"
                heading="Contact seller"
                submitLabel="Send message"
                compact
              />
            </div>

            {/* Additional services */}
            <div className="mt-4 border border-grey-300 p-4">
              <p className="text-md font-semibold">Additional services</p>
              <p className="mt-2 text-base">Inspection</p>
              <p className="text-base text-grey-800">
                Independent pre-purchase inspection report
              </p>
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold">Latest added products</h2>
          <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
            {related.map((item) => (
              <div key={item.id} className="w-[280px] shrink-0">
                <VehicleCard vehicle={item} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
