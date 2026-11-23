/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { App } from "./App";
import { loadPersisted } from "./lib/persist";
import { restoreScores } from "./lib/score";
import { restoreScreenState } from "./lib/screenState";

const elem = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// https://bun.com/docs/bundler/hot-reloading#import-meta-hot-data
type HotData = { root?: Root };
// Load saved scores and screen state before the first render, so screens
// start from them instead of a fresh question.
loadPersisted().then((saved) => {
  restoreScores(saved);
  restoreScreenState(saved);
  ((import.meta.hot.data as HotData).root ??= createRoot(elem)).render(app);
});
