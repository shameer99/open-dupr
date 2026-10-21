// Retire locally stored sessions without making any requests to DUPR.
try {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  sessionStorage.removeItem("open-dupr-api-base");
} catch {
  // The notice still works when browser storage is unavailable.
}

// Existing installations should update to the retirement worker at /sw.js.
// New visitors do not need a service worker.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      if (registration.scope === new URL("/", location.origin).href) {
        void registration.update().catch(() => {});
      }
    }
  }).catch(() => {});
}
