import type { Config } from 'tailwindcss';

/**
 * Tokens measured from basworld.com (see REFERENCE_AUDIT.md §5), not invented.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Every value below was read with getComputedStyle on the live site.
        ink: '#1D1D1A',            // body text, USP bar, footer, spec pills
        iconStroke: '#1D1D1D',     // category icon line art (a shade off `ink`)
        brand: {
          DEFAULT: '#1DA15E',      // logo "BAS", AI-search chip, "Show more"
          dark: '#115F37',
          deep: '#005E33',
        },
        // The two primary calls to action on a vehicle page.
        cta: '#FFCC33',            // "Request offer" — amber, black label
        ctaGreen: '#067539',       // "Configure now" — dark green, white label
        sale: '#D13535',           // discounted price on the detail page
        link: '#0F62FE',           // Carbon blue 60
        success: '#067539',
        grey: {
          100: '#F4F4F4',          // --cds-field / --cds-layer
          200: '#E8E8E8',          // --cds-layer-hover
          300: '#E0E0E0',          // --cds-border-subtle
          400: '#C6C6C6',
          450: '#C4C4C4',
          500: '#A0A0A0',
          600: '#8D8D8D',          // --cds-border-strong
          700: '#747474',
          800: '#6F6F6F',
        },
      },
      fontFamily: {
        sans: ['"Titillium Web"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // The reference runs on a 14/24 base.
        xs: ['12px', '16px'],
        sm: ['13px', '20px'],
        base: ['14px', '24px'],
        md: ['16px', '24px'],
        lg: ['18px', '26px'],
        xl: ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['28px', '36px'],
        '4xl': ['32px', '40px'],
        '5xl': ['40px', '48px'],
        '6xl': ['48px', '56px'],
      },
      spacing: {
        header: '80px',            // desktop header
        'header-mobile': '56px',
        usp: '32px',
        'usp-mobile': '44px',
        catbar: '60px',
        sidebar: '283px',          // stock filter column
        results: '904px',          // stock results column
        pdpLeft: '730px',
        pdpRight: '487px',
      },
      maxWidth: {
        content: '1200px',
        page: '1217px',
      },
      borderRadius: {
        // Measured: buttons, spec pills and cards all use 4px, not the 2px
        // Carbon default the stylesheet hints at.
        minimal: '4px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08)',
        cardHover: '0 4px 12px rgba(0,0,0,0.12)',
        menu: '0 8px 24px rgba(0,0,0,0.16)',
      },
      screens: {
        xs: '375px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1440px',
        '3xl': '1920px',
      },
      keyframes: {
        uspScroll: {
          '0%, 22%':   { transform: 'translateY(0)' },
          '25%, 47%':  { transform: 'translateY(-32px)' },
          '50%, 72%':  { transform: 'translateY(-64px)' },
          '75%, 97%':  { transform: 'translateY(-96px)' },
          '100%':      { transform: 'translateY(-128px)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
      },
      animation: {
        usp: 'uspScroll 16s linear infinite',
        fadeIn: 'fadeIn 150ms ease-out',
        slideUp: 'slideUp 220ms cubic-bezier(0.2, 0, 0.38, 0.9)',
      },
    },
  },
  plugins: [],
};

export default config;
