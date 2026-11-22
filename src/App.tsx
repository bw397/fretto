import { useCallback, useEffect, useState } from "react";
import { HeaderSlotContext } from "./components/HeaderSlot";
import { Menu } from "./components/Menu";
import { DEFAULT_SCREEN, SCREENS } from "./screens";
import "./index.css";

function screenFromHash() {
  const id = window.location.hash.replace(/^#\/?/, "");
  return SCREENS.find((s) => s.id === id) ?? DEFAULT_SCREEN;
}

export function App() {
  const [screen, setScreen] = useState(screenFromHash);
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const onHash = () => setScreen(screenFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const Screen = screen.component;

  return (
    <div className="app">
      <header className="app-header">
        <a className="brand" href={`#/${DEFAULT_SCREEN.id}`}>
          fretto
        </a>
        <h1 className="screen-title">{screen.title}</h1>
        <div className="header-slot" ref={setHeaderSlot} />
        <button
          className={`hamburger${menuOpen ? " open" : ""}`}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="main-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>
      <Menu open={menuOpen} screens={SCREENS} currentId={screen.id} onClose={closeMenu} />
      <main className="app-main">
        <HeaderSlotContext.Provider value={headerSlot}>
          <Screen key={screen.id} />
        </HeaderSlotContext.Provider>
      </main>
    </div>
  );
}

export default App;
