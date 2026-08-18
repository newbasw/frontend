/**
 * Trustpilot rating marks.
 *
 * The reference embeds Trustpilot's own widget, which is tied to their business
 * account and cannot be reused. These reproduce the same visual: green squares
 * with a white star, the final square partially filled to show the fraction,
 * and Trustpilot's star glyph beside the wordmark.
 */

const TRUSTPILOT_GREEN = '#00B67A';
const TRUSTPILOT_GREY = '#DCDCE6';

function Star({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4 6.2 20.5l1.1-6.5L2.6 9.4l6.5-.9L12 2.6z" />
    </svg>
  );
}

/**
 * `rating` is out of 5. The last tile is clipped horizontally to the remainder,
 * which is exactly how Trustpilot renders a half score.
 */
export function TrustpilotStars({ rating, size = 20 }: { rating: number; size?: number }) {
  const clamped = Math.max(0, Math.min(5, rating));

  return (
    <span
      className="flex items-center gap-[2px]"
      role="img"
      aria-label={`${clamped} out of 5 stars`}
    >
      {[0, 1, 2, 3, 4].map((index) => {
        const fill = Math.max(0, Math.min(1, clamped - index));
        return (
          <span
            key={index}
            className="relative inline-flex items-center justify-center"
            style={{ width: size, height: size, backgroundColor: TRUSTPILOT_GREY }}
          >
            <span
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${fill * 100}%`, backgroundColor: TRUSTPILOT_GREEN }}
            />
            <span className="relative flex items-center justify-center">
              <Star size={size * 0.72} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function TrustpilotLogo({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4 6.2 20.5l1.1-6.5L2.6 9.4l6.5-.9L12 2.6z" />
    </svg>
  );
}

/** The block repeated in the vehicle-detail sidebar. */
export function TrustpilotSummary({
  rating,
  count,
}: {
  rating: number;
  count: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-base">
      <span className="font-semibold">Excellent</span>
      <TrustpilotStars rating={rating} />
      <span>
        <span className="font-semibold">{count.toLocaleString('en-GB')}</span> reviews on
      </span>
      <span className="flex items-center gap-1 font-semibold">
        <TrustpilotLogo />
        Trustpilot
      </span>
    </div>
  );
}
