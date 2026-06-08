import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

/**
 * Fade out the inline splash screen (index.html) once the app has mounted.
 * A short minimum keeps the reveal smooth instead of flashing; the element is
 * removed after the CSS opacity transition so it never intercepts input.
 */
function dismissSplash() {
  const splash = document.getElementById("splash");
  if (!splash) return;
  splash.classList.add("is-hidden");
  splash.addEventListener("transitionend", () => splash.remove(), {
    once: true,
  });
  // Fallback removal in case the transition event doesn't fire.
  window.setTimeout(() => splash.remove(), 800);
}

// Wait for the first paint after mount, then a brief beat, before revealing.
requestAnimationFrame(() => window.setTimeout(dismissSplash, 450));
