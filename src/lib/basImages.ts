/**
 * BAS World media helpers.
 *
 * Two of their CDNs are used directly, both verified to serve cross-origin
 * without hotlink protection:
 *
 *   cms.media.basworld.com/i/basgroup/<name>   Amplience — editorial, heroes,
 *                                              banners, article cards. Supports
 *                                              ?w= and ?fmt=webp resizing.
 *   static.basworld.com/photos/vehicle/world/  vehicle photography, sized
 *     <size>/<id>_<hash>.jpg                   1280 (full) or 250 (thumb).
 *
 * Every name below was read off the live homepage, not invented.
 */

const AMPLIENCE = 'https://cms.media.basworld.com/i/basgroup/';

/** Editorial image URL at a given width, served as WebP. */
export function cmsImage(name: string, width = 1200): string {
  return `${AMPLIENCE}${encodeURIComponent(name)}?w=${width}&fmt=webp`;
}

/**
 * Swap a vehicle photo to the small variant the reference uses for thumbnails.
 *
 * Both photo hosts size by a path segment, and the full-size segment is not
 * always the same number — the static library publishes 1280 or 1080, the
 * media host 1080. Matching only one of them left most of a 100+ image strip
 * pulling full-size files: 268 KB per thumbnail instead of 9 KB.
 */
export function vehicleThumb(url: string): string {
  return url
    .replace(/\/photos\/vehicle\/world\/\d+\//, '/photos/vehicle/world/250/')
    .replace(/\/pi-pv\/\d+\//, '/pi-pv/250/');
}

/**
 * Amplience video delivery. The homepage hero is a 30-second brand film served
 * from the same CMS as the imagery, with an image behind it as the fallback.
 * Only `mp4_720p` and `mp4_480p` exist — webm and 1080p both 404.
 */
export function cmsVideo(name: string, profile: 'mp4_720p' | 'mp4_480p' = 'mp4_720p'): string {
  return `https://cms.media.basworld.com/v/basgroup/${encodeURIComponent(name)}/${profile}`;
}

/** The hero brand film, and the still the reference falls back to. */
export const HERO_VIDEO = {
  name: '250708_BASWorld_Brandfilm_30sec_Alt_HEADER_Zonder logo_ZonderAnimatie_v2',
  poster: 'BAS_HQ_Overlay_Black_50',
} as const;

/** YouTube poster frame for listings that carry a walkaround video. */
export function youtubePoster(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export function youtubeEmbed(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Named homepage assets, exactly as the reference serves them.
 * Keeping them in one place means a renamed asset is a one-line fix.
 */
export const HOME_MEDIA = {
  hero: 'BAS_HQ_Overlay_Black_50',
  heroAlt: 'BAS_HQ_Overlay_Black_50_1',
  banner: 'Banner landingspagina',
  trucks: 'New_or_used_trucks',
  tractorUnits: 'Foto 3 - Tractor units',
  commercialVehicles: 'Foto_4_commercial_vehicles',
  machinery: 'Foto_5_machinery',
  farmEquipment: 'Foto_6_farm_equipment',
  trailers: 'Foto_7_trailers',
  store: 'BAS_WORLD_4_NOV_KLEIN_FORMAAT_110',
  team: 'BAS_WORLD_4_NOV_KLEIN_FORMAAT_18',
  workshop: 'KLAAR BAS WORLD 31 JULI KLEIN - 45',
  yard: 'BAS_WORLD_2_DEC_KLEIN_FORMAAT_98',
} as const;

/**
 * Editorial images, keyed by the slug this database actually stores.
 *
 * The live site uses long descriptive slugs while our seed uses short ones,
 * so both forms are listed: the short key is what resolves here today, and the
 * long key keeps working if the catalogue is ever re-imported from the source.
 *
 * Landing and information pages point at BAS World's own photography of their
 * premises, yard and workshop. Legal and utility pages are absent on purpose —
 * they get no image rather than a borrowed one.
 */
export const ARTICLE_MEDIA: Record<string, string> = {
  // Articles — short slugs, as seeded.
  'buying-an-articulated-dump-truck': 'knikdumper_header',
  'volvo-fh-vs-volvo-fm': 'fhvsfm_header',
  'quick-coupler-excavator': 'Liebherr graafmachine',
  'how-many-pallets-fit-on-a-truck': 'blog hoeveel pallets passen er op een vrachtwagen',
  'three-way-or-rear-tipper': 'kippervergelijking_header',
  'payload-vs-range-electric-van': 'actieradius_header',
  'mercedes-sprinter-vs-vw-crafter': 'sprintervscrafter_header',
  'truck-tolls-in-europe': 'Truck toll in Europa',
  'buying-a-hydraulic-breaker': 'hamer_header',
  'sinotruk-howo-371': 'Sinotruk',
  'buying-a-mega-trailer': 'Mega_trailer',
  'which-liebherr-excavator': 'Liebherr graafmachine',

  // Landing pages — the category photography from the homepage.
  trucks: HOME_MEDIA.trucks,
  'tractor-units': HOME_MEDIA.tractorUnits,
  vans: HOME_MEDIA.commercialVehicles,
  machinery: HOME_MEDIA.machinery,
  'semi-trailers': HOME_MEDIA.trailers,
  'sell-your-vehicle': HOME_MEDIA.yard,

  // Information pages — BAS World's own premises.
  'about-bas-world': HOME_MEDIA.team,
  'contact-us': HOME_MEDIA.store,
  'how-to-buy': HOME_MEDIA.yard,
  faq: HOME_MEDIA.workshop,
  'bas-world-store': HOME_MEDIA.store,
  news: HOME_MEDIA.banner,

  // Long-form slugs as used on the live site.
  'buying-an-articulated-dump-truck-how-to-assess-payload-tyres-and-operating-hours': 'knikdumper_header',
  'volvo-fh-vs-volvo-fm-which-volvo-truck-suits-your-work': 'fhvsfm_header',
  'three-way-tipper-or-rear-tipper-which-suits-your-work': 'kippervergelijking_header',
  'payload-vs-range-for-an-electric-cargo-van-how-to-make-the-right-choice': 'actieradius_header',
  'mercedes-sprinter-vs-volkswagen-crafter-which-cargo-van-suits-your-work': 'sprintervscrafter_header',
  'truck-tolls-europe': 'Truck toll in Europa',
  'buying-a-hydraulic-breaker-for-an-excavator-what-to-look-out-for': 'hamer_header',
  'sinotruk-howo-371-mining-construction': 'Sinotruk',
  'buying-mega-trailer-extra-load-volume': 'Mega_trailer',
  'which-liebherr-excavator-to-choose': 'Liebherr graafmachine',
  'volvo-ec-series-excavators-overview-and-differences': 'volvograafmachines_header',
  'volvo-fh-vs-scania-r-which-tractor-unit-is-smarter-to-buy': 'volvofhvsscaniar_header',
  'daf-xf-vs-daf-xg-when-do-you-choose-the-xf-and-when-the-xg': 'dafxfvsxg_header',
  'when-to-choose-a-curtainsider-trailer': 'Tautliner',
};

/**
 * Card/hero image for an editorial page.
 *
 * Returns null when we have no genuine BAS World photograph for the slug —
 * legal and utility pages have none — so callers leave the image out rather
 * than substitute invented artwork.
 */
export function articleImage(slug: string, width = 676): string | null {
  const name = ARTICLE_MEDIA[slug];
  return name ? cmsImage(name, width) : null;
}
