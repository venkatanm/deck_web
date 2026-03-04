/**
 * YjsProvider - WebSocket sync and Awareness for multiplayer.
 * Provides Y.Doc, WebsocketProvider, and Awareness. YjsSync bridges to Zustand.
 */

import { createContext, useContext, useMemo, useRef } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:1234";
const ROOM_NAME = import.meta.env.VITE_WS_ROOM ?? "deck-web-presentation";

interface YjsContextValue {
  doc: Y.Doc;
  provider: WebsocketProvider | null;
}

const YjsContext = createContext<YjsContextValue | null>(null);

interface YjsProviderProps {
  children: React.ReactNode;
}

export function YjsProvider({ children }: YjsProviderProps) {
  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  const doc = useMemo(() => {
    if (docRef.current) return docRef.current;
    const d = new Y.Doc();
    docRef.current = d;
    return d;
  }, []);

  const provider = useMemo(() => {
    if (typeof window === "undefined") return null;
    if (providerRef.current) return providerRef.current;
    const p = new WebsocketProvider(WS_URL, ROOM_NAME, doc);
    providerRef.current = p;
    return p;
  }, [doc]);

  const value = useMemo<YjsContextValue>(() => ({ doc, provider }), [doc, provider]);

  return <YjsContext.Provider value={value}>{children}</YjsContext.Provider>;
}

export function useYjs() {
  const ctx = useContext(YjsContext);
  if (!ctx) throw new Error("useYjs must be used within YjsProvider");
  return ctx;
}

/** Optional: use Yjs only when inside provider */
export function useYjsOptional() {
  return useContext(YjsContext);
}
