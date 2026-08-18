import { SmartImage as Image } from '../ui/SmartImage';
import Link from 'next/link';
import { BadgeCheck, Building } from '../icons';
import { BasWorldMark } from '../ui/BasWorldMark';
import { FavoriteButton } from './FavoriteButton';
import { cardSpecs, formatPrice } from '@/lib/format';
import type { VehicleSummary } from '@shared/types';

interface Props {
  vehicle: VehicleSummary;
  /** `grid` (default) or `list`, matching the reference's view toggle. */
  view?: 'grid' | 'list';
  priority?: boolean;
}

/**
 * Vehicle card, rebuilt against the live reference.
 *
 * Corrections from the earlier version, all observed directly:
 *  · specs are separated by vertical pipes and wrap onto two lines, not middots
 *  · "Brand NEW" is a diagonal corner ribbon, not a flat badge
 *  · the price block is centred, and a discounted price is green (the detail
 *    page uses red for the same value — they genuinely differ)
 *  · BAS World's own stock is prefixed with the green logo mark; partner stock
 *    gets a building icon and a "Trusted selling partner" line
 */
export function VehicleCard({ vehicle, view = 'grid', priority = false }: Props) {
  const specs = cardSpecs(vehicle);
  const price = formatPrice(vehicle.price_cents);
  const priceBefore = formatPrice(vehicle.price_before_cents);
  const isPartner = vehicle.seller?.kind === 'trusted_partner';
  const isBasWorld = !isPartner;
  const isList = view === 'list';

  return (
    <Link
      href={vehicle.href}
      data-testid="vehicle-card"
      className={`group relative flex overflow-hidden rounded-minimal border border-grey-300 bg-white transition-shadow hover:shadow-cardHover ${
        isList ? 'flex-col sm:flex-row' : 'flex-col'
      }`}
    >
      <div
        className={`relative shrink-0 overflow-hidden bg-grey-100 ${
          isList ? 'aspect-[4/3] sm:aspect-auto sm:h-[210px] sm:w-[280px]' : 'aspect-[4/3] w-full'
        }`}
      >
        {/*
          Every listing carries real BAS World photography. If one ever arrives
          without any, show the plain grey frame rather than invent a picture.
        */}
        {vehicle.primary_image?.url && (
          <Image
            src={vehicle.primary_image.url}
            alt={vehicle.primary_image.alt ?? vehicle.title}
            fill
            sizes={isList ? '280px' : '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 361px'}
            priority={priority}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}

        {/* Diagonal corner ribbon, as on the reference. */}
        {vehicle.condition === 'new' && (
          <span
            aria-label="Brand new"
            className="pointer-events-none absolute -left-[42px] top-[22px] w-[160px] -rotate-45 bg-brand py-1 text-center text-xs font-semibold uppercase tracking-wide text-white shadow-card"
          >
            Brand NEW
          </span>
        )}

        <FavoriteButton vehicleId={vehicle.id} initial={vehicle.is_favorite ?? false} />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h4 className="truncate text-md font-semibold leading-6">{vehicle.title}</h4>

        {isPartner ? (
          <p className="mt-1 flex items-center gap-1 truncate text-base text-grey-800">
            <BadgeCheck size={14} className="shrink-0" />
            Trusted selling partner
          </p>
        ) : vehicle.subtitle ? (
          <p className="mt-1 truncate text-base text-grey-800">{vehicle.subtitle}</p>
        ) : (
          <p className="mt-1 text-base">&nbsp;</p>
        )}

        {/* Pipe-separated spec row, wrapping to a second line. */}
        <div className="mt-3 flex flex-1 flex-wrap items-center gap-y-1 text-base text-grey-800">
          {specs.map((spec, i) => (
            <span key={spec + i} className="flex items-center">
              {i > 0 && <span className="mx-2 text-grey-400">|</span>}
              {spec}
            </span>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-base text-grey-800">
          {vehicle.seller?.name && (
            <span className="flex min-w-0 items-center gap-1.5">
              {isBasWorld ? <BasWorldMark size={13} /> : <Building size={13} />}
              <span className="truncate">{vehicle.seller.name}</span>
            </span>
          )}
          {vehicle.country && (
            <span className="flex shrink-0 items-center gap-1.5">
              <Image
                src={vehicle.country.flag_path}
                alt=""
                width={14}
                height={14}
                className="h-3.5 w-3.5 rounded-full object-cover"
              />
              {vehicle.country.name}
            </span>
          )}
        </div>

        {/* Centred price block. */}
        <div className="mt-4 border-t border-grey-300 pt-3 text-center">
          <p className="flex items-center justify-center gap-2 text-base text-grey-800">
            Buy
            {priceBefore && <span className="font-semibold text-ink line-through">{priceBefore}</span>}
          </p>
          <p
            className={`text-2xl font-semibold leading-8 ${priceBefore ? 'text-brand' : 'text-ink'}`}
          >
            {price ?? 'Price on request'}
          </p>
        </div>
      </div>
    </Link>
  );
}
