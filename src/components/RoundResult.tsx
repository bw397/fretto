import { useEffect, useRef, type ReactNode } from "react";
import { scrollIntoView, scrollToTop } from "../lib/scroll";

interface Props {
  revealed: boolean;
  correct: boolean;
  /** The success or failure message. */
  children: ReactNode;
  nextLabel: string;
  onNext: () => void;
}

/**
 * The result message and Next button at the bottom of a practice screen.
 * Scrolls itself into view when the answer is revealed, and scrolls back to
 * the top when Next is pressed.
 */
export function RoundResult({ revealed, correct, children, nextLabel, onNext }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!revealed) return;
    scrollIntoView(ref.current);
    nextRef.current?.focus({ preventScroll: true });
  }, [revealed]);

  return (
    <div ref={ref} className="result" aria-live="polite">
      {revealed && (
        <>
          <p className={`result-msg ${correct ? "ok" : "bad"}`}>{children}</p>
          <button
            ref={nextRef}
            className="next-btn"
            onClick={() => {
              onNext();
              scrollToTop();
            }}
          >
            {nextLabel}
          </button>
        </>
      )}
    </div>
  );
}
