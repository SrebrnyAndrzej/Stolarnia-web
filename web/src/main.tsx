import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./v2/App";
import { PanelBoundary } from "./v2/PanelBoundary";
import "./styles.css";
import "./v2/styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PanelBoundary>
      <App />
    </PanelBoundary>
  </StrictMode>,
);
