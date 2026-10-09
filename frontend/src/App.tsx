import { useEffect } from "react";
import { api } from "./api/client";
import { HeartbreakOverlay } from "./components/HeartbreakOverlay";
import { Sidebar } from "./components/Sidebar";
import { AnalyzePage } from "./pages/AnalyzePage";
import { HomePage } from "./pages/HomePage";
import { SettingsPage } from "./pages/SettingsPage";
import { AppProvider, useApp } from "./state/appState";
import type { OrbState } from "./types";

function Shell() {
  const { state, dispatch } = useApp();

  useEffect(() => {
    api
      .getConfig()
      .then((config) => dispatch({ type: "SET_CONFIG", config }))
      .catch(() => dispatch({ type: "SET_CONFIG", config: null }));
  }, [dispatch]);

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
        {state.page === "home" && <HomePage orbState={orbState} />}
        {state.page === "analyze" && <AnalyzePage orbState={orbState} />}
        {state.page === "settings" && <SettingsPage />}
      </main>
      {state.heartbreakActive && state.report && <HeartbreakOverlay />}
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
