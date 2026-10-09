import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import type { AppConfig, ChatMessage, Mode, Page, RelationshipInfo, Report } from "../types";

export interface AppState {
  page: Page;
  step: number;
  photos: { user: string | null; crush: string | null };
  myInterests: string[];
  theirInterests: string[];
  relationship: RelationshipInfo;
  interactionNotes: string;
  analyzing: boolean;
  analyzeError: string | null;
  report: Report | null;
  usedVision: boolean;
  mode: Mode;
  heartbreakActive: boolean;
  musicOpen: boolean;
  autoplayMusic: boolean;
  messages: ChatMessage[];
  chatPending: boolean;
  pendingAsk: string | null;
  config: AppConfig | null;
  configLoaded: boolean;
}

const initialState: AppState = {
  page: "home",
  step: 0,
  photos: { user: null, crush: null },
  myInterests: [],
  theirInterests: [],
  relationship: {
    status: "",
    frequency: "",
    initiator: "",
    goal: "",
    myPersonality: "",
    theirPersonality: "",
  },
  interactionNotes: "",
  analyzing: false,
  analyzeError: null,
  report: null,
  usedVision: false,
  mode: "normal",
  heartbreakActive: false,
  musicOpen: false,
  autoplayMusic: false,
  messages: [],
  chatPending: false,
  pendingAsk: null,
  config: null,
  configLoaded: false,
};

export type Action =
  | { type: "SET_PAGE"; page: Page }
  | { type: "SET_STEP"; step: number }
  | { type: "SET_PHOTO"; which: "user" | "crush"; dataUrl: string }
  | { type: "REMOVE_PHOTO"; which: "user" | "crush" }
  | { type: "TOGGLE_INTEREST"; side: "my" | "their"; name: string }
  | { type: "SET_REL"; key: keyof RelationshipInfo; value: string }
  | { type: "SET_NOTES"; value: string }
  | { type: "SET_ANALYZING"; value: boolean }
  | { type: "SET_ANALYZE_ERROR"; message: string | null }
  | { type: "SET_REPORT"; report: Report; usedVision: boolean }
  | { type: "SET_MODE"; mode: Mode }
  | { type: "SET_HEARTBREAK"; value: boolean }
  | { type: "SET_MUSIC_OPEN"; value: boolean }
  | { type: "TOGGLE_AUTOPLAY" }
  | { type: "ADD_MESSAGE"; message: ChatMessage }
  | { type: "SET_CHAT_PENDING"; value: boolean }
  | { type: "SET_PENDING_ASK"; text: string | null }
  | { type: "CLEAR_CHAT" }
  | { type: "SET_CONFIG"; config: AppConfig | null }
  | { type: "RESET_FORM" }
  | { type: "RESET_ALL" };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_PAGE":
      return { ...state, page: action.page };
    case "SET_STEP":
      return { ...state, step: action.step };
    case "SET_PHOTO":
      return { ...state, photos: { ...state.photos, [action.which]: action.dataUrl } };
    case "REMOVE_PHOTO":
      return { ...state, photos: { ...state.photos, [action.which]: null } };
    case "TOGGLE_INTEREST": {
      const key = action.side === "my" ? "myInterests" : "theirInterests";
      const list = state[key];
      const next = list.includes(action.name)
        ? list.filter((x) => x !== action.name)
        : [...list, action.name];
      return { ...state, [key]: next };
    }
    case "SET_REL":
      return { ...state, relationship: { ...state.relationship, [action.key]: action.value } };
    case "SET_NOTES":
      return { ...state, interactionNotes: action.value.slice(0, 1500) };
    case "SET_ANALYZING":
      return { ...state, analyzing: action.value, analyzeError: action.value ? null : state.analyzeError };
    case "SET_ANALYZE_ERROR":
      return { ...state, analyzeError: action.message, analyzing: false };
    case "SET_REPORT":
      return {
        ...state,
        report: action.report,
        usedVision: action.usedVision,
        analyzing: false,
        analyzeError: null,
        photos: { user: null, crush: null },
      };
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "SET_HEARTBREAK":
      return { ...state, heartbreakActive: action.value, musicOpen: action.value ? state.musicOpen : false };
    case "SET_MUSIC_OPEN":
      return { ...state, musicOpen: action.value };
    case "TOGGLE_AUTOPLAY":
      return { ...state, autoplayMusic: !state.autoplayMusic };
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };
    case "SET_CHAT_PENDING":
      return { ...state, chatPending: action.value };
    case "SET_PENDING_ASK":
      return { ...state, pendingAsk: action.text };
    case "CLEAR_CHAT":
      return { ...state, messages: [] };
    case "SET_CONFIG":
      return { ...state, config: action.config, configLoaded: true };
    case "RESET_FORM":
      return {
        ...state,
        step: 0,
        photos: { user: null, crush: null },
        myInterests: [],
        theirInterests: [],
        relationship: initialState.relationship,
        interactionNotes: "",
        analyzing: false,
        analyzeError: null,
      };
    case "RESET_ALL":
      return {
        ...initialState,
        config: state.config,
        configLoaded: true,
        autoplayMusic: state.autoplayMusic,
        page: "analyze",
      };    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

let idCounter = 0;
export function newId(): string {
  idCounter += 1;
  return `m${Date.now().toString(36)}-${idCounter}`;
}
