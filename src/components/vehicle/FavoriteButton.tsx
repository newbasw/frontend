'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { clientApi } from '@/lib/api';
import { useAuth } from '../auth/AuthProvider';
import { StarOutline, StarSolid } from '../icons';

type Variant = 'overlay' | 'labelled' | 'plain';

interface Props {
  vehicleId: string;
  initial?: boolean;
  size?: number;
  className?: string;
  /**
   * `overlay`  — rounded button floated over a card image (listing grid)
   * `labelled` — full-width outlined button with text (detail sidebar)
   * `plain`    — bare icon, no chrome (detail page header actions)
   */
  variant?: Variant;
}

/**
 * Favourite toggle. Writes straight through to the API, so the state survives a
 * refresh. Signed-out users are sent to /login with a return path rather than
 * getting an optimistic toggle that silently evaporates.
 */
export function FavoriteButton({
  vehicleId,
  initial = false,
  size = 20,
  className = '',
  variant = 'overlay',
}: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function toggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      router.push(
        `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
      );
      return;
    }

    const next = !saved;
    setSaved(next); // optimistic
    setError(null);

    try {
      if (next) {
        await clientApi('/api/favorites', {
          method: 'POST',
          body: JSON.stringify({ vehicleId }),
        });
      } else {
        await clientApi(`/api/favorites/${vehicleId}`, { method: 'DELETE' });
      }
      startTransition(() => router.refresh());
    } catch {
      setSaved(!next); // roll back
      setError('Could not save. Please try again.');
    }
  }

  const Icon = saved ? StarSolid : StarOutline;
  const label = saved ? 'Remove from favourites' : 'Add to favourites';

  if (variant === 'labelled') {
    return (
      <div>
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          aria-pressed={saved}
          className={`bw-btn-outline w-full ${className}`}
          data-testid="favorite-button"
        >
          <Icon size={size} />
          {saved ? 'Saved' : 'Save vehicle'}
        </button>
        {error && <p className="bw-field-error">{error}</p>}
      </div>
    );
  }

  if (variant === 'plain') {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={saved}
        aria-label={label}
        title={label}
        data-testid="favorite-button"
        className={`text-ink transition-colors hover:text-brand ${className}`}
      >
        <Icon size={size} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={label}
      data-testid="favorite-button"
      className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-minimal bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/60 ${className}`}
    >
      <Icon size={size} />
    </button>
  );
}
