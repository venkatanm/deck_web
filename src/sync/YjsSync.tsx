/**
 * YjsSync - Bridges Zustand store with Yjs document.
 * Local mutations flow Zustand -> Yjs. Remote mutations flow Yjs -> Zustand.
 */

import { useEffect } from "react";
import { applyPresentationToYDoc, presentationFromYDoc } from "./yjsPresentation";
import { useYjs } from "./YjsProvider";
import { usePresentationStore } from "../store/usePresentationStore";

/** Prevents feedback loop when applying remote Yjs updates to Zustand */
const skipPushToYjs = { current: false };

export function YjsSync() {
  const { doc, provider } = useYjs();

  useEffect(() => {
    const unsub = usePresentationStore.subscribe((state) => {
      if (skipPushToYjs.current) {
        skipPushToYjs.current = false;
        return;
      }
      applyPresentationToYDoc(doc, state.presentation);
    });

    return unsub;
  }, [doc]);

  useEffect(() => {
    const handleUpdate = () => {
      skipPushToYjs.current = true;
      usePresentationStore.setState({
        presentation: presentationFromYDoc(doc),
      });
    };

    const handleSync = (synced: boolean) => {
      if (synced) {
        const root = doc.getMap("presentation");
        if (root.size > 0) {
          handleUpdate();
        } else {
          applyPresentationToYDoc(doc, usePresentationStore.getState().presentation);
        }
      }
    };

    doc.on("update", handleUpdate);
    provider?.on("sync", handleSync);

    return () => {
      doc.off("update", handleUpdate);
      provider?.off("sync", handleSync);
    };
  }, [doc, provider]);

  return null;
}
