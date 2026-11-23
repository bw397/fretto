import { useCallback, useEffect, useState } from "react";
import { HeaderSlotContext } from "./components/HeaderSlot";
import { Menu } from "./components/Menu";
import { readScreenState, writeScreenState } from "./lib/screenState";
import { DEFAULT_SCREEN, SCREENS } from "./screens";
import "./index.css";

const LAST_SCREEN_KEY = "app.screen";

function screenFromHash() {
  const id = window.location.hash.replace(/^#\/?/, "");
  return SCREENS.find((s) => s.id === id) ?? DEFAULT_SCREEN;
}

/** The screen in the URL, or with no hash, the screen open last time. */
function initialScreen() {
  if (window.location.hash.replace(/^#\/?/, "")) return screenFromHash();
  const saved = SCREENS.find((s) => s.id === readScreenState<string>(LAST_SCREEN_KEY));
  if (!saved) return DEFAULT_SCREEN;
  history.replaceState(null, "", `#/${saved.id}`);
  return saved;
}

export function App() {
  const [screen, setScreen] = useState(initialScreen);
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const onHash = () => setScreen(screenFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => writeScreenState(LAST_SCREEN_KEY, screen.id), [screen.id]);

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
