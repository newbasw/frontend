'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Reveals its children as they scroll into view.
 *
 * Three things make this behave rather than annoy:
 *
 *   - It uses IntersectionObserver, so nothing runs on scroll events and a
 *     long page costs nothing while it sits still.
 *   - It reveals once and then stops observing. Content that re-animates every
 *     time you scroll past is the thing that makes these effects tiresome.
 *   - It respects `prefers-reduced-motion`, and anything already on screen at
 *     first paint is shown immediately — so the top of a page never waits for
 *     an observer callback before becoming readable.
 *
 * Content is visible with JavaScript disabled: the hidden state is applied by
 * the component after mount, never by the server-rendered markup.
 */

type Direction = 'up' | 'left' | 'right' | 'none';

export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  className = '',
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  direction?: Direction;
  /** Stagger, in milliseconds. */
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article';
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    /*
     * Everything below runs inside a guard.
     *
     * An error thrown from this effect escapes into React and takes the whole
     * page down with it — a decorative animation must never be able to do
     * that. If anything here fails, the content is simply shown.
     */
    try {
      return setup(node);
    } catch {
      setShown(true);
      return;
    }
  }, []);

  function setup(node: HTMLElement) {

    // Arm only after mount, so server-rendered content is never hidden for a
    // reader without JavaScript.
    setArmed(true);

    let done = false;
    let frame = 0;
    let failsafe = 0;

    /*
     * Declared before `reveal`, which reads it.
     *
     * `reveal` runs immediately for anything already on screen at mount, so a
     * `let` declared further down would still be in its temporal dead zone at
     * that moment and throw. That error escapes the effect, kills hydration,
     * and empties the page — which is exactly what happened on listing pages,
     * where the first cards are always in view.
     */
    let observer: IntersectionObserver | null = null;

    const reveal = () => {
      if (done) return;
      done = true;
      setShown(true);
      observer?.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      clearTimeout(failsafe);
      cancelAnimationFrame(frame);
    };

    /*
     * Geometry check, used on mount and on scroll.
     *
     * This is the mechanism that actually guarantees the reveal. It does not
     * depend on IntersectionObserver firing — some embedded and headless
     * browsers never deliver those callbacks, and content that stays at
     * opacity 0 forever is a far worse outcome than a missing animation.
     */
    const inView = () => {
      const r = node.getBoundingClientRect();
      const margin = window.innerHeight * 0.08;
      return r.top < window.innerHeight - margin && r.bottom > 0;
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (inView()) reveal();
      });
    };

    // Anything already on screen appears immediately, with no wait.
    if (inView()) {
      reveal();
      return;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // IntersectionObserver when it works: cheaper, and catches movement that
    // is not caused by scrolling.
    if (typeof IntersectionObserver === 'function') {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) reveal();
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
      );
      observer.observe(node);
    }

    /*
     * Last resort. If neither path has fired after a few seconds — a browser
     * with no observer that also never emits scroll events — show the content
     * anyway. Nothing on this site is ever allowed to stay invisible.
     */
    failsafe = window.setTimeout(reveal, 4000);

    return () => {
      observer?.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      clearTimeout(failsafe);
      cancelAnimationFrame(frame);
    };
  }

  const hidden = armed && !shown;

  const offset =
    direction === 'up' ? 'translate3d(0, 24px, 0)'
    : direction === 'left' ? 'translate3d(-24px, 0, 0)'
    : direction === 'right' ? 'translate3d(24px, 0, 0)'
    : 'none';

  return (
    <Tag
      ref={ref as never}
      data-revealed={shown ? 'true' : 'false'}
      className={className}
      style={{
        opacity: hidden ? 0 : 1,
        transform: hidden ? offset : 'none',
        transition: `opacity 620ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 620ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        // Only promote while the transition can still run.
        willChange: hidden ? 'opacity, transform' : undefined,
      }}
    >
      {children}
    </Tag>
  );
}

/**
 * Staggers a list of children, capping the delay so a long grid never leaves
 * the last card waiting seconds to appear.
 */
export function RevealGroup({
  children,
  step = 70,
  maxDelay = 350,
  direction = 'up',
  className = '',
}: {
  children: React.ReactNode[];
  step?: number;
  maxDelay?: number;
  direction?: Direction;
  className?: string;
}) {
  return (
    <>
      {children.map((child, i) => (
        <Reveal
          key={i}
          direction={direction}
          delay={Math.min(i * step, maxDelay)}
          className={className}
        >
          {child}
        </Reveal>
      ))}
    </>
  );
}
