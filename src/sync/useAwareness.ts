/**
 * useAwareness - Subscribe to Yjs Awareness for live cursors.
 * Returns map of clientID -> { x, y, name, color, selection? }
 */

import { useEffect, useState } from "react";
import type { Awareness } from "y-protocols/awareness";

export interface AwarenessState {
  clientID: number;
  x?: number;
  y?: number;
  name?: string;
  color?: string;
  selection?: { slideId: string; elementId: string };
}

const COLORS = [
  "#EF4444",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
];

function getColor(clientID: number): string {
  return COLORS[Math.abs(clientID) % COLORS.length]!;
}

export function useAwarenessStates(awareness: Awareness | undefined): Map<number, AwarenessState> {
  const [states, setStates] = useState<Map<number, AwarenessState>>(new Map());

  useEffect(() => {
    if (!awareness) return;

    const update = () => {
      const next = new Map<number, AwarenessState>();
      awareness.getStates().forEach((state, clientID) => {
        if (state && clientID !== awareness.clientID) {
          const cursor = state.cursor as { x: number; y: number } | undefined;
          const user = state.user as { name: string; color?: string } | undefined;
          next.set(clientID, {
            clientID,
            x: cursor?.x,
            y: cursor?.y,
            name: user?.name ?? `User ${clientID}`,
            color: user?.color ?? getColor(clientID),
            selection: state.selection as { slideId: string; elementId: string } | undefined,
          });
        }
      });
      setStates(next);
    };

    update();
    awareness.on("change", update);
    return () => awareness.off("change", update);
  }, [awareness]);

  return states;
}

export function useLocalAwareness(awareness: Awareness | undefined) {
  return {
    setCursor: (x: number, y: number) => {
      if (awareness) {
        const curr = awareness.getLocalState() ?? {};
        awareness.setLocalState({ ...curr, cursor: { x, y } });
      }
    },
    setUser: (name: string, color?: string) => {
      if (awareness) {
        const curr = awareness.getLocalState() ?? {};
        awareness.setLocalState({ ...curr, user: { name, color: color ?? getColor(awareness.clientID) } });
      }
    },
    setSelection: (slideId: string | null, elementId: string | null) => {
      if (awareness) {
        const curr = awareness.getLocalState() ?? {};
        awareness.setLocalState({
          ...curr,
          selection: slideId && elementId ? { slideId, elementId } : null,
        });
      }
    },
  };
}
