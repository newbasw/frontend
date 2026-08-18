import { SmartImage as Image } from '../ui/SmartImage';
import { CirclePhone, ChevronDown } from '../icons';
import { TrustpilotStars, TrustpilotLogo } from '../ui/Trustpilot';

const SLOGANS = [
  'Buy safely worldwide, we speak your language and can arrange transport',
  'Explore 200.000m² of vehicles in the biggest showroom in Europe',
  'Find the vehicle that you are looking for easily online',
];

interface Props {
  reviewCount: number;
  reviewAverage: number;
}

/**
 * The strip above the header.
 *
 * Measured on the live site: `background #1D1D1A`, white text, **32px** tall,
 * 14px/400. Left: the Trustpilot summary. Centre: rotating slogans. Right:
 * phone number and language. (An earlier build had this white with dark text —
 * it is the other way round.)
 */
export function UspBar({ reviewCount, reviewAverage }: Props) {
  return (
    <div className="bg-ink text-white">
      <div className="page-wrapper flex h-11 items-center justify-between gap-4 md:h-8">
        {/* Trustpilot */}
        <div className="flex shrink-0 items-center gap-2 text-xs">
          <span className="font-semibold">Excellent</span>
          <TrustpilotStars rating={reviewAverage} />
          <p className="hidden whitespace-nowrap sm:block">
            <span className="font-semibold">{reviewCount.toLocaleString('en-GB')}</span> reviews on
          </p>
          <span className="hidden items-center gap-1 sm:flex">
            <TrustpilotLogo />
            <span className="font-semibold">Trustpilot</span>
          </span>
          <span className="whitespace-nowrap sm:hidden">{reviewAverage} out of 5</span>
        </div>

        {/* Rotating slogans — clipped to one line, animated by translateY */}
        <div className="hidden h-8 flex-1 overflow-hidden md:block" aria-live="off">
          <div className="animate-usp motion-reduce:animate-none">
            {[...SLOGANS, SLOGANS[0]].map((slogan, i) => (
              <span key={i} className="flex h-8 items-center justify-center text-center text-xs">
                {slogan}
              </span>
            ))}
          </div>
        </div>

        {/* Phone + language */}
        <div className="hidden shrink-0 items-center gap-4 md:flex">
          <div className="flex items-center gap-2">
            <CirclePhone size={14} />
            <a href="tel:+31413728320" className="text-xs hover:underline">
              +31 413 72 8320
            </a>
          </div>
          <button type="button" className="flex items-center gap-1 text-xs">
            <Image
              src="/resources/icons/flags/en.svg"
              alt=""
              width={16}
              height={12}
              className="h-3 w-4 object-cover"
            />
            <span className="underline">English</span>
            <ChevronDown size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}
