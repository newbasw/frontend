'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SmartImage as Image } from '../ui/SmartImage';
import { cmsImage, HOME_MEDIA } from '@/lib/basImages';

/**
 * The floating chat button.
 *
 * Draggable, because a fixed bubble always ends up covering something —
 * a price, a spec row, the last card in a grid. The reader moves it once and
 * it stays where they put it.
 *
 * Details that make dragging feel right rather than fiddly:
 *
 *   - Pointer events, so mouse, touch and pen all work from one code path.
 *   - A movement threshold separates a drag from a tap. Without it, every
 *     attempt to move the button would also open the chat.
 *   - The position is a corner offset, not a coordinate, so it survives a
 *     window resize instead of ending up off-screen.
 *   - It snaps to whichever side is nearer on release, so it never floats in
 *     the middle of the text.
 *   - Where the reader left it is remembered.
 */

/** How far the pointer must travel before this counts as a drag, not a tap. */
const DRAG_THRESHOLD_PX = 4;
const EDGE_GAP = 16;
const STORAGE_KEY = 'bw_chat_launcher_pos';

interface Offset {
  /** Distance from the right edge, in pixels. */
  right: number;
  /** Distance from the bottom edge, in pixels. */
  bottom: number;
}

const DEFAULT_OFFSET: Offset = { right: 20, bottom: 20 };

function clampToViewport(offset: Offset, size: { w: number; h: number }): Offset {
  const maxRight = Math.max(EDGE_GAP, window.innerWidth - size.w - EDGE_GAP);
  const maxBottom = Math.max(EDGE_GAP, window.innerHeight - size.h - EDGE_GAP);
  return {
    right: Math.min(Math.max(EDGE_GAP, offset.right), maxRight),
    bottom: Math.min(Math.max(EDGE_GAP, offset.bottom), maxBottom),
  };
}

export function ChatLauncher({ onOpen }: { onOpen: () => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState<Offset>(DEFAULT_OFFSET);
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);

  // Live drag bookkeeping, kept in a ref so moves do not re-render per frame.
  const drag = useRef({ active: false, moved: false, startX: 0, startY: 0, from: DEFAULT_OFFSET });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Offset;
        if (Number.isFinite(parsed.right) && Number.isFinite(parsed.bottom)) {
          const size = { w: ref.current?.offsetWidth ?? 220, h: ref.current?.offsetHeight ?? 56 };
          setOffset(clampToViewport(parsed, size));
        }
      }
    } catch {
      /* A corrupt saved value is not worth failing over. */
    }
    setReady(true);
  }, []);

  // A smaller window must not leave the button stranded off-screen.
  useEffect(() => {
    const onResize = () => {
      const size = { w: ref.current?.offsetWidth ?? 220, h: ref.current?.offsetHeight ?? 56 };
      setOffset((o) => clampToViewport(o, size));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const persist = useCallback((next: Offset) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* Private browsing; the position simply will not be remembered. */
    }
  }, []);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    // Ignore secondary buttons so a right-click never starts a drag.
    if (event.button !== 0 && event.pointerType === 'mouse') return;

    drag.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
      from: offset,
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;

    const dx = event.clientX - drag.current.startX;
    const dy = event.clientY - drag.current.startY;

    if (!drag.current.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;

    if (!drag.current.moved) {
      drag.current.moved = true;
      setDragging(true);
    }

    // Moving right decreases the distance from the right edge; likewise down.
    const size = { w: ref.current?.offsetWidth ?? 220, h: ref.current?.offsetHeight ?? 56 };
    setOffset(
      clampToViewport(
        { right: drag.current.from.right - dx, bottom: drag.current.from.bottom - dy },
        size,
      ),
    );
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    const wasDrag = drag.current.moved;
    drag.current.active = false;
    drag.current.moved = false;
    setDragging(false);

    try {
      (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {
      /* Capture may already be gone. */
    }

    if (!wasDrag) {
      onOpen();
      return;
    }

    // Settle against the nearer side so it never sits over the middle.
    const size = { w: ref.current?.offsetWidth ?? 220, h: ref.current?.offsetHeight ?? 56 };
    setOffset((current) => {
      const centreX = window.innerWidth - current.right - size.w / 2;
      const snapped = clampToViewport(
        {
          right:
            centreX < window.innerWidth / 2
              ? window.innerWidth - size.w - EDGE_GAP
              : EDGE_GAP,
          bottom: current.bottom,
        },
        size,
      );
      persist(snapped);
      return snapped;
    });
  }

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        right: `${offset.right}px`,
        bottom: `${offset.bottom}px`,
        zIndex: 70,
        // Hidden until the saved position is read, so it never visibly jumps.
        visibility: ready ? 'visible' : 'hidden',
        transition: dragging ? 'none' : 'right 260ms cubic-bezier(0.16, 1, 0.3, 1)',
        touchAction: 'none',
        cursor: dragging ? 'grabbing' : 'grab',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <button
        type="button"
        data-testid="chat-bubble"
        aria-label="Chat with the BAS World team"
        /*
          The pointer handlers live on the wrapper, so this button only has to
          serve keyboard users — a mouse click arrives via onPointerUp.
        */
        onClick={(e) => {
          e.preventDefault();
          if (!drag.current.moved) onOpen();
        }}
        className={`group flex select-none items-center gap-3 rounded-full bg-ink py-2 pl-2 pr-5 text-left shadow-menu transition-transform hover:bg-black ${
          dragging ? 'scale-[1.03]' : ''
        }`}
      >
        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
          {/*
            Loaded eagerly. The launcher sits in a fixed-position wrapper, and
            a lazily-loaded fill image there is never judged to be "in view",
            so it would sit at zero width indefinitely.
          */}
          <Image
            src={cmsImage(HOME_MEDIA.team, 120)}
            alt=""
            fill
            priority
            sizes="40px"
            className="object-cover"
            draggable={false}
          />
          {/* Presence dot: someone is actually on the other end. */}
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-ink bg-ctaGreen" />
        </span>

        <span className="text-white">
          <span className="block text-md font-semibold leading-tight">Chat with us</span>
          <span className="block text-xs text-white/70">We usually reply in minutes</span>
        </span>

        {/* Grip, so it reads as movable without a tooltip. */}
        <span
          aria-hidden
          className="ml-1 hidden text-white/30 transition-colors group-hover:text-white/60 sm:block"
          title="Drag to move"
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
            <circle cx="2" cy="3" r="1.3" />
            <circle cx="8" cy="3" r="1.3" />
            <circle cx="2" cy="8" r="1.3" />
            <circle cx="8" cy="8" r="1.3" />
            <circle cx="2" cy="13" r="1.3" />
            <circle cx="8" cy="13" r="1.3" />
          </svg>
        </span>
      </button>
    </div>
  );
}
