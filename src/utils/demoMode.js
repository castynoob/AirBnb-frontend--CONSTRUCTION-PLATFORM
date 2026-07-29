// =============================================================================
// Demo mode — client-side flag that swaps the real jobs/properties feed for a
// pre-baked simulated dataset. Used for investor pitches and sales demos so
// the map looks lively regardless of real platform activity.
//
// Storage: localStorage. That means it's per-browser, not per-user. Whoever
// is running the pitch enables it in their browser, does the demo, disables
// it when done. The visible red banner at the top of the app is the reminder.
//
// Subscribing: components that want to react in-tab call `subscribeDemoMode`;
// we dispatch a custom event whenever the flag flips. Native `storage` events
// don't fire in the same tab that made the change, hence the custom bus.
// =============================================================================

const STORAGE_KEY = "intervos:demo-mode";
const EVENT_NAME = "intervos:demo-mode-change";

export const isDemoModeOn = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

export const setDemoMode = (on) => {
  try {
    if (on) localStorage.setItem(STORAGE_KEY, "true");
    else    localStorage.removeItem(STORAGE_KEY);
    // Notify same-tab listeners. Cross-tab is handled by native 'storage'.
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { on: !!on } }));
  } catch { /* localStorage disabled — feature just won't work */ }
};

// Subscribe to demo-mode changes. Returns an unsubscribe function.
// Fires for both same-tab (custom event) and cross-tab (storage event) flips.
export const subscribeDemoMode = (cb) => {
  const localHandler = (e) => cb(!!e?.detail?.on);
  const storageHandler = (e) => {
    if (e.key === STORAGE_KEY) cb(e.newValue === "true");
  };
  window.addEventListener(EVENT_NAME, localHandler);
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(EVENT_NAME, localHandler);
    window.removeEventListener("storage", storageHandler);
  };
};
