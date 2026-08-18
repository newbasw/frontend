import type { SVGProps } from 'react';

/**
 * Category icons, extracted verbatim from the reference site's category bar.
 *
 * These are the real inline SVGs basworld.com renders (`CategoryBar_svgIcon`):
 * line art at `stroke="#1D1D1D"`, `stroke-width="1.5"`, `stroke-miterlimit="10"`,
 * each with its own intrinsic width and a 26px height. The widths differ per
 * icon (31px for a tractor unit, 90px for the "various" scene) and that is
 * deliberate — the bar aligns them on a shared baseline, not a shared box.
 */

type IconProps = SVGProps<SVGSVGElement>;

interface IconSpec {
  width: number;
  height: number;
  paths: string[];
}

/** Keyed by the category slug used in `/stock/<slug>`. */
export const CATEGORY_ICONS: Record<string, IconSpec> = {
  light_commercial_vehicle: {
    width: 54,
    height: 26,
    paths: [
      'm43.872 13.417-.963-1.537h-6.883V6.897h7.44M16.093 21.841a3.16 3.16 0 1 1-6.318 0 3.16 3.16 0 0 1 6.318 0ZM1.015 16.22l.257-14.253A.986.986 0 0 1 2.257 1h35.358a3.89 3.89 0 0 1 3.299 1.828l5.655 9.053 4.306 2.717a1.942 1.942 0 0 1 .904 1.524l.634 4.585a.787.787 0 0 1-.73.895l-3.698.243h-.683a3.16 3.16 0 1 0-6.32 0H16.09a3.16 3.16 0 1 0-6.32 0H1.896a.656.656 0 0 1-.655-.617L1 18.686l.015-2.466Zm46.278 5.62a3.16 3.16 0 1 1-6.318 0 3.16 3.16 0 0 1 6.318 0Z',
    ],
  },
  truck: {
    width: 49,
    height: 26,
    paths: [
      'm46.66 13.69-.485-7.136h-12.59m6.792 3.203v3.313l7.285.718v7.952h-5.508m-2.992-2.208h-5.577m0 0V2.854s5.19-.11 7.785 3.7m-7.785 12.978h-7.092v2.208h-5.545m12.637-2.208v3.437h-7.092v-1.228m-13.236-.001h2.097M1 1h32.584v18.531H1V1Zm14.48 21.265a2.734 2.734 0 1 0 5.468 0 2.734 2.734 0 0 0-5.469 0Zm-7.692 0a2.735 2.735 0 1 0 5.47 0 2.735 2.735 0 0 0-5.47 0Zm28.952 0a2.734 2.734 0 1 0 5.47 0 2.734 2.734 0 0 0-5.47 0Z',
    ],
  },
  tractorhead: {
    width: 31,
    height: 26,
    paths: [
      'm28.782 12.742-.525-7.733H14.612m8.438.001C20.237.881 14.612 1 14.612 1v18.075m0 0h6.044m-6.044 0H6.927v2.392m7.685-2.392H3.963m-2.907 2.392a2.963 2.963 0 0 1 2.907-2.393m0 0a2.963 2.963 0 0 1 2.908 2.393h.055v1.331h7.686v-1.331h3.476a2.963 2.963 0 0 1 5.814 0h5.97v-8.618l-7.9-.778v-3.59m-3.94 13.556a2.963 2.963 0 1 0 5.926 0 2.963 2.963 0 0 0-5.926 0ZM1 22.037a2.963 2.963 0 1 0 5.927 0 2.963 2.963 0 0 0-5.927 0Z',
    ],
  },
  construction_equipment: {
    width: 37,
    height: 26,
    paths: [
      'M14.852 19.401v-1.433h2.058l1.31-1.31v-2.771l-.973-4.942h-6.663v5.416M10.584 11.982H2.037A1.035 1.035 0 0 0 1 13.02v4.949h8.31V19.4',
      'M17.248 8.946V6.531l8.818-5.226a2.074 2.074 0 0 1 2.919.806l5.485 10.466 1.46 3.209a1.037 1.037 0 0 1-.48 1.356l-1.318.66a3.11 3.11 0 0 1-3.396-.404l-2.154-1.817 6.162-2.403-7.277-8.548-9.91 5.868',
      'M14.12 11.116v2.772h4.1M3.823 25a2.114 2.114 0 1 0 0-4.228 2.114 2.114 0 0 0 0 4.228ZM19.698 25a2.114 2.114 0 1 0 0-4.228 2.114 2.114 0 0 0 0 4.228ZM3.823 20.772l7.938-.366 7.937.366M19.698 25H3.823',
    ],
  },
  semi_trailer: {
    width: 47,
    height: 26,
    paths: [
      'M13.204 21.74h2.326m5.365 0h2.232m5.644 0h15.147m-1.854 3.259v-3.26M1 1h45.196v18.53H1V1Zm19.911 20.828a2.734 2.734 0 1 1-5.398.875 2.734 2.734 0 0 1 5.398-.875Zm-7.69 0a2.734 2.734 0 1 1-5.399.875 2.734 2.734 0 0 1 5.398-.875Zm15.339 0a2.734 2.734 0 1 1-5.399.875 2.734 2.734 0 0 1 5.399-.875Z',
    ],
  },
  trailer: {
    width: 42,
    height: 26,
    paths: [
      'M35.712 21.97h5.142m-28.883-.23h18.114M1 21.97h5.785M1.643 1h38.77v18.531H1.643V1Zm4.86 21.265a2.735 2.735 0 1 0 5.469 0 2.735 2.735 0 0 0-5.47 0Zm29.05 0a2.734 2.734 0 1 1-5.468 0 2.734 2.734 0 0 1 5.469 0Z',
    ],
  },
  combination: {
    width: 70,
    height: 26,
    paths: [
      'm68.057 13.69-.484-7.136h-12.59m6.792 3.203v3.313l7.285.718v7.952h-5.508m-2.992-2.208h-5.578m0 0V2.854s5.191-.11 7.786 3.7m-7.785 12.978H47.89v2.208h-5.544m12.637-2.208v3.437H47.89v-1.228m-13.235-.001h2.097M0 19.53h19.385V1H0m14.684 20.57H29.47M0 21.74h9.057M22.398 1h32.584v18.531H22.398V1Zm14.48 21.265a2.734 2.734 0 1 0 5.468 0 2.734 2.734 0 0 0-5.469 0Zm-7.692 0a2.734 2.734 0 1 0 5.469 0 2.734 2.734 0 0 0-5.47 0Zm28.952 0a2.734 2.734 0 1 0 5.469 0 2.734 2.734 0 0 0-5.469 0Zm-43.612 0a2.734 2.734 0 1 1-5.469 0 2.734 2.734 0 0 1 5.469 0Z',
    ],
  },
  various: {
    width: 90,
    height: 27,
    paths: [
      'M22.808 13.233h20.807M22.043 9.326h51.882M54.585 13.233h23.032l10.16 1.628',
      'M73.925 4.767v4.56l3.693 3.907M25.736 4.767v4.559M43.615 4.767v18.56M54.585 4.767v18.56M49.1 13.233v10.094M89 7.732 87.87 4.17h-3.487',
      'M27.404 23.328h3.478a3.652 3.652 0 0 1 3.345-5.13 3.658 3.658 0 0 1 3.645 3.359 3.652 3.652 0 0 1-.3 1.77H70.73a3.651 3.651 0 0 1 3.346-5.126 3.657 3.657 0 0 1 3.644 3.356 3.65 3.65 0 0 1-.299 1.77h10.357v-8.465L84.523 4.603a4.43 4.43 0 0 0-4.227-3.092H20.338a1.11 1.11 0 0 0-1.085.882L18.04 8.21a11.06 11.06 0 0 0-.236 2.26v2.31',
      'M37.883 21.857a3.652 3.652 0 0 1-2.256 3.375 3.659 3.659 0 0 1-4.985-2.663 3.651 3.651 0 0 1 3.586-4.366 3.657 3.657 0 0 1 3.655 3.654ZM77.732 21.857a3.652 3.652 0 0 1-2.257 3.375 3.659 3.659 0 0 1-4.984-2.663 3.65 3.65 0 0 1 1.554-3.75 3.657 3.657 0 0 1 5.687 3.038ZM24.114 21.857l-3.159-4.768M9.113 13.794l-5.664-.848s.749 1.325 4.357 3.517a5.925 5.925 0 0 1 3.062 5.703',
      'm4.656 21.79 13.02 1.127v-2.755l4.247-4.245h1.522a.857.857 0 0 0 .602-1.466l-4.034-3.978v2.898s-4.457-2.192-6.792 1.768',
      'M27.77 21.857a3.652 3.652 0 0 1-2.257 3.376 3.66 3.66 0 0 1-4.986-2.663 3.652 3.652 0 0 1 3.587-4.367 3.658 3.658 0 0 1 3.378 2.256c.184.443.278.918.278 1.398ZM8.312 21.857a3.651 3.651 0 0 1-2.257 3.375 3.659 3.659 0 0 1-4.985-2.663 3.65 3.65 0 0 1 1.555-3.75 3.657 3.657 0 0 1 5.687 3.038Z',
    ],
  },
};

/**
 * The reference bar uses `semi_trailer`, while its sitemap also publishes
 * `semi-trailer`. Our catalogue stores the hyphenated form, so both resolve.
 */
const SLUG_ALIASES: Record<string, string> = {
  'semi-trailer': 'semi_trailer',
  'light-commercial-vehicle': 'light_commercial_vehicle',
  'construction-equipment': 'construction_equipment',
};

export function CategoryIcon({
  slug,
  className,
  ...rest
}: IconProps & { slug: string }) {
  const spec = CATEGORY_ICONS[SLUG_ALIASES[slug] ?? slug];
  if (!spec) return null;

  return (
    <svg
      width={spec.width}
      height={spec.height}
      viewBox={`0 0 ${spec.width} ${spec.height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      {spec.paths.map((d) => (
        <path
          key={d.slice(0, 24)}
          d={d}
          stroke="currentColor"
          strokeWidth={1.5}
          strokeMiterlimit={10}
        />
      ))}
    </svg>
  );
}

export function hasCategoryIcon(slug: string): boolean {
  return !!CATEGORY_ICONS[SLUG_ALIASES[slug] ?? slug];
}
