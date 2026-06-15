import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { requestPersistentStorage } from "./db/storageService";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const serviceWorkerUrl = `${import.meta.env.BASE_URL}sw.js`;

    navigator.serviceWorker.register(serviceWorkerUrl, {
      scope: import.meta.env.BASE_URL,
    }).catch(() => undefined);
  });
}

void requestPersistentStorage().catch(() => undefined);
