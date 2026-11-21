import { createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** The element in the sticky app header that screens can render into. */
export const HeaderSlotContext = createContext<HTMLElement | null>(null);

/** Renders children into the app header (falls back to inline rendering). */
export function HeaderSlot({ children }: { children: ReactNode }) {
  const slot = useContext(HeaderSlotContext);
  return slot ? createPortal(children, slot) : <>{children}</>;
}
