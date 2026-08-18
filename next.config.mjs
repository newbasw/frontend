/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // The mirrored catalogue points at BAS World's own image CDN. Both hosts
    // are theirs, and both were verified to serve cross-origin without
    // hotlink protection. Nothing user-supplied can reach the optimizer.
    remotePatterns: [
      // Vehicle photography.
      { protocol: 'https', hostname: 'static.basworld.com', pathname: '/photos/**' },
      { protocol: 'https', hostname: 'media.basworld.com', pathname: '/pi-pv/**' },
      // Partner stock is hosted on the auction platform's own CDN.
      { protocol: 'https', hostname: 'media.app.artisio.co', pathname: '/**' },
      // Editorial imagery: heroes, banners, category photos, article cards.
      { protocol: 'https', hostname: 'cms.media.basworld.com', pathname: '/i/basgroup/**' },
      { protocol: 'https', hostname: 'basgroup.a.bigcontent.io', pathname: '/**' },
      // Logos, flags and other first-party static assets.
      { protocol: 'https', hostname: 'www.basworld.com', pathname: '/resources/**' },
      // Poster frames for listings that carry a walkaround video.
      { protocol: 'https', hostname: 'img.youtube.com', pathname: '/vi/**' },
    ],
    formats: ['image/webp'],
    deviceSizes: [375, 390, 414, 768, 1024, 1280, 1440, 1920],
    imageSizes: [12, 16, 32, 64, 128, 232, 256, 338, 361, 730, 1080],

    // The optimizer refuses SVG, and correctly so — it is a scriptable format.
    // Rather than switching that protection off globally, `<VehicleImage>`
    // marks vector sources `unoptimized` and lets them through untouched.
    // Vector art gains nothing from resizing or WebP conversion anyway.
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
  /*
   * Proxy API calls through this origin.
   *
   * The API lives on another host, which makes its session cookie third-party
   * — and browsers increasingly refuse to store or send those. The symptom is
   * a login that succeeds and then evaporates: the header shows the account
   * for a moment, the next request arrives with no cookie, and the reader is
   * signed out again.
   *
   * Serving the API from this origin makes the cookie first-party, so it is
   * kept and sent like any other. This is the plain rewrites array, which runs
   * *after* the filesystem routes, so this app's own /api/cron/sync still
   * resolves locally and only unmatched paths fall through to the backend.
   */
  async rewrites() {
    const origin = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
    if (!origin) return [];
    return [{ source: '/api/:path*', destination: `${origin}/api/:path*` }];
  },
  async redirects() {
    return [
      // The reference site links the footer "How to buy" item at /how-to-buy
      // while the CMS page itself lives under /content/.
      { source: '/how-to-buy', destination: '/content/how-to-buy', permanent: false },
      // /stock is a required catch-all so that an unknown category returns a
      // real 404 rather than a soft one; the bare path redirects to the
      // canonical "everything" listing.
      { source: '/stock', destination: '/stock/all', permanent: false },
      /*
       * The reference keeps a /service-desk URL family alive: /service-desk/faq
       * is a real page, while the bare path and /service-desk/contact simply
       * fall back to the homepage. Matched here so inbound links behave the
       * same way on both sites rather than 404ing on ours.
       */
      { source: '/service-desk', destination: '/', permanent: false },
      { source: '/service-desk/contact', destination: '/content/contact-us', permanent: false },
    ];
  },
};

export default nextConfig;
