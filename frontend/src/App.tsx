import { lazy, Suspense, useEffect } from "react";
import { api } from "./api/client";
import { Sidebar } from "./components/Sidebar";
import { HomePage } from "./pages/HomePage";
import { AppProvider, useApp } from "./state/appState";
import type { OrbState } from "./types";

const AnalyzePage = lazy(() =>
  import("./pages/AnalyzePage").then((m) => ({ default: m.AnalyzePage }))
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage }))
);
const HeartbreakOverlay = lazy(() =>
  import("./components/HeartbreakOverlay").then((m) => ({ default: m.HeartbreakOverlay }))
);

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4 text-sm text-muted">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent/25 border-t-neocyan" />
        กำลังโหลด...
      </div>
    </div>
  );
}

function Shell() {
  const { state, dispatch } = useApp();

  useEffect(() => {
    document.getElementById("boot-splash")?.remove();
  }, []);

  useEffect(() => {
    api
      .getConfig()
      .then((config) => dispatch({ type: "SET_CONFIG", config }))
      .catch(() => dispatch({ type: "SET_CONFIG", config: null }));
  }, [dispatch]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void import("./pages/AnalyzePage");
      void import("./pages/SettingsPage");
      void import("./components/HeartbreakOverlay");
    }, 2500);
    return () => window.clearTimeout(id);
  }, []);

  const orbState: OrbState = state.heartbreakActive
    ? "heartbreak"
    : state.analyzing
      ? "analyzing"
      : state.chatPending
        ? "responding"
        : state.analyzeError
          ? "error"
          : "idle";

  return (
    <div className={`app-root min-h-dvh ${state.heartbreakActive ? "app-heartbreak" : "app-heartbreak-transition"}`}>
      <Sidebar />
      <main className="relative z-[5] px-4 pb-16 sm:px-6 lg:pl-[292px] lg:pr-8">
        <Suspense fallback={<PageFallback />}>
          {state.page === "home" && <HomePage orbState={orbState} />}
          {state.page === "analyze" && <AnalyzePage orbState={orbState} />}
          {state.page === "settings" && <SettingsPage />}
        </Suspense>
      </main>
      {state.heartbreakActive && state.report && (
        <Suspense fallback={null}>
          <HeartbreakOverlay />
        </Suspense>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
