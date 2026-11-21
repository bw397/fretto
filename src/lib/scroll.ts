import { useEffect, useRef, type RefObject } from "react";

const behavior = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

/** Scroll just enough to bring `el` fully into view (respects scroll-margin). */
export function scrollIntoView(el: Element | null | undefined) {
  el?.scrollIntoView({ behavior: behavior(), block: "nearest" });
}

export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: behavior() });
}

/**
 * Scrolls to `target` whenever it changes to a new element. Screens use it to
 * bring the next unfinished step into view as the user works through a round.
 * Doesn't scroll on mount, so returning to a screen leaves the page at the top.
 */
export function useScrollTo(target: RefObject<HTMLElement | null> | null) {
  const prev = useRef(target);
  useEffect(() => {
    if (target && target !== prev.current) scrollIntoView(target.current);
    prev.current = target;
  }, [target]);
}

/** Calls `fn` when `value` turns from false to true (not on mount). */
export function useOnBecomeTrue(value: boolean, fn: () => void) {
  const prev = useRef(value);
  useEffect(() => {
    if (value && !prev.current) fn();
    prev.current = value;
  });
}
