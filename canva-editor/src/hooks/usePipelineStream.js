import { useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import useEditorStore from "../store/useEditorStore";
import {
  buildSlideElements,
  applyBrandKitToPages,
} from "../utils/importContentSchema";

const WS_URL = "ws://localhost:3002";

export function usePipelineStream() {
  const wsRef = useRef(null);
  const statusRef = useRef("idle");
  const status = useEditorStore((s) => s.pipelineStream.status);
  statusRef.current = status;

  const brandKit = useEditorStore((s) => s.brandKit);
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const addPage = useEditorStore((s) => s.addPage);
  const setPages = useEditorStore((s) => s.setPages);
  const setCurrentPageId = useEditorStore((s) => s.setCurrentPageId);
  const setPipelineStream = useEditorStore((s) => s.setPipelineStream);
  const resetPipelineStream = useEditorStore((s) => s.resetPipelineStream);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setPipelineStream({
      status: "connecting",
      slideCount: 0,
      totalSlides: 0,
      title: "",
      error: null,
    });

    // Clear existing pages to make room for stream
    setPages([]);

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setPipelineStream({ status: "streaming" });
    };

    ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if (msg.type === "start") {
        setPipelineStream({
          status: "streaming",
          title: msg.title || "",
          totalSlides: msg.totalSlides || 0,
          slideCount: 0,
        });
        setPages([]);
      }

      if (msg.type === "slide") {
        const elements = buildSlideElements(
          msg.slide,
          brandKit,
          canvasSize.width,
          canvasSize.height
        );

        const slide = msg.slide || {};
        const isDarkSlide =
          slide.slideType === "cover" ||
          slide.slideType === "section-divider" ||
          slide.slideType === "full-bleed-text";
        const primary = brandKit?.colors?.[0]?.hex || "#7c3aed";
        const bgColor =
          brandKit?.colors?.find(
            (c) =>
              c.name?.toLowerCase().includes("background") ||
              c.name?.toLowerCase().includes("bg")
          )?.hex || null;
        const backgroundColor = isDarkSlide
          ? bgColor || "#0f172a"
          : "#ffffff";

        const [branded] = applyBrandKitToPages(
          [
            {
              id: uuidv4(),
              name: slide.title || `Slide ${(msg.index ?? 0) + 1}`,
              elements,
              backgroundColor,
            },
          ],
          brandKit,
          canvasSize
        );

        addPage(branded);

        if (msg.index === 0) {
          setCurrentPageId(branded.id);
        }

        const current =
          useEditorStore.getState().pipelineStream.slideCount;
        setPipelineStream({ slideCount: current + 1 });
      }

      if (msg.type === "complete") {
        setPipelineStream({ status: "complete" });
        ws.close();
      }

      if (msg.type === "error") {
        setPipelineStream({
          status: "error",
          error: msg.message || "Pipeline error",
        });
        ws.close();
      }
    };

    ws.onerror = () => {
      setPipelineStream({
        status: "error",
        error: "Cannot connect — is pipeline-bridge.js running?",
      });
    };

    ws.onclose = () => {
      if (statusRef.current === "streaming") {
        setPipelineStream({ status: "complete" });
      }
      wsRef.current = null;
    };
  }, [
    brandKit,
    canvasSize,
    addPage,
    setPages,
    setCurrentPageId,
    setPipelineStream,
  ]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    resetPipelineStream();
  }, [resetPipelineStream]);

  useEffect(() => {
    return () => wsRef.current?.close();
  }, []);

  const slideCount = useEditorStore((s) => s.pipelineStream.slideCount);
  const error = useEditorStore((s) => s.pipelineStream.error);

  return {
    status: status,
    slideCount,
    error,
    connect,
    disconnect,
  };
}
