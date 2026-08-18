import Image, { type ImageProps } from 'next/image';

/**
 * `next/image` with two adjustments, both about not doing work twice.
 *
 * 1. **Vector sources skip the optimizer.** Next refuses to run SVG through it
 *    (SVG can carry script) and that protection is worth keeping. Resizing and
 *    WebP conversion do nothing for vector art anyway.
 *
 * 2. **BAS World's CDNs skip the optimizer.** Amplience already returns WebP at
 *    the exact width we ask for via `?w=&fmt=webp`, and the vehicle CDN serves
 *    pre-sized JPEGs. Re-fetching and re-encoding all of those on our own
 *    server made the homepage's ~127 images crawl in one at a time on a cold
 *    load. Passing them straight through is both faster and cheaper.
 *
 * Anything else — local raster, or a future host we add — goes through the
 * optimizer exactly as normal, with no call-site changes.
 */

const PASSTHROUGH_HOSTS = [
  'cms.media.basworld.com',
  'media.basworld.com',
  'media.app.artisio.co',
  'static.basworld.com',
  'basgroup.a.bigcontent.io',
  'img.youtube.com',
];

function isPassthrough(src: string): boolean {
  if (src.endsWith('.svg') || src.includes('.svg?')) return true;
  return PASSTHROUGH_HOSTS.some((host) => src.includes(host));
}

export function SmartImage(props: ImageProps) {
  const src = typeof props.src === 'string' ? props.src : '';
  return <Image {...props} unoptimized={props.unoptimized ?? isPassthrough(src)} />;
}
