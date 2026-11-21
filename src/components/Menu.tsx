import { useEffect } from "react";
import { CATEGORIES, type ScreenDef } from "../screens";

interface Props {
  open: boolean;
  screens: ScreenDef[];
  currentId: string;
  onClose: () => void;
}

export function Menu({ open, screens, currentId, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div className={`menu-backdrop${open ? " open" : ""}`} onClick={onClose} aria-hidden />
      <nav
        id="main-menu"
        className={`menu-drawer${open ? " open" : ""}`}
        aria-label="Screens"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="menu-top">
          <button className="menu-close" aria-label="Close menu" onClick={onClose}>
            ×
          </button>
        </div>
        {CATEGORIES.map((category) => {
          const items = screens.filter((s) => s.category === category);
          if (items.length === 0) return null;
          return (
            <section key={category} className="menu-group">
              <h2 className="menu-title">{category}</h2>
              <ul>
                {items.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#/${s.id}`}
                      className={s.id === currentId ? "active" : undefined}
                      aria-current={s.id === currentId ? "page" : undefined}
                      onClick={onClose}
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </nav>
    </>
  );
}
