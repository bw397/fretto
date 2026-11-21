import { useEffect, type RefObject } from "react";

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
 */
export function useScrollTo(target: RefObject<HTMLElement | null> | null) {
  useEffect(() => {
    if (target) scrollIntoView(target.current);
  }, [target]);
}
