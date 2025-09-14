import React from "react";
import ReactDOM from "react-dom/client";
import RootRouter from "./pages/RootRouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { performanceMonitor } from "./utils/performanceMonitor";

// Service worker is automatically registered by VitePWA plugin

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Initialize performance monitoring
performanceMonitor.init();

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <RootRouter />
    </ErrorBoundary>
  </React.StrictMode>
);
