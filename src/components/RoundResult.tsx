import { useRef, type ReactNode } from "react";
import { scrollIntoView, scrollToTop, useOnBecomeTrue } from "../lib/scroll";

interface Props {
  /** Every step has an answer, so the round can be checked. */
  ready: boolean;
  submitted: boolean;
  onSubmit: () => void;
  correct: boolean;
  /** The success or failure message, shown after submitting. */
  children: ReactNode;
  nextLabel: string;
  onNext: () => void;
}

/**
 * The bottom of a practice screen: a Check answer button until the round is
 * submitted, then the result message and Next button.
 *
 * Scrolls itself into view when the round becomes ready and when the result
 * appears, and scrolls back to the top when Next is pressed.
 */
export function RoundResult({ ready, submitted, onSubmit, correct, children, nextLabel, onNext }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  useOnBecomeTrue(ready && !submitted, () => scrollIntoView(ref.current));
  useOnBecomeTrue(submitted, () => {
    scrollIntoView(ref.current);
    nextRef.current?.focus({ preventScroll: true });
  });

  return (
    <div ref={ref} className="result" aria-live="polite">
      {submitted ? (
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
      ) : (
        <>
          <button className="next-btn" disabled={!ready} onClick={onSubmit}>
            Check answer
          </button>
          {!ready && <p className="result-hint">Answer every step to check.</p>}
        </>
      )}
    </div>
  );
}
