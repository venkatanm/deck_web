/**
 * Yjs Presentation Sync - Converts Universal Schema <-> Yjs shared types.
 * CRDT: Y.Map for objects, Y.Array for arrays. Enables conflict-free multiplayer.
 */

import * as Y from "yjs";
import type { Presentation } from "@deck-web/schema";

/** Recursively convert plain object to Y.Map */
function objToYMap(obj: Record<string, unknown>): Y.Map<unknown> {
  const m = new Y.Map<unknown>();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      m.set(k, arrToYArray(v));
    } else if (v !== null && typeof v === "object" && !(v instanceof Y.Map) && !(v instanceof Y.Array)) {
      m.set(k, objToYMap(v as Record<string, unknown>));
    } else {
      m.set(k, v);
    }
  }
  return m;
}

/** Recursively convert array to Y.Array */
function arrToYArray(arr: unknown[]): Y.Array<unknown> {
  const a = new Y.Array<unknown>();
  for (const v of arr) {
    if (Array.isArray(v)) {
      a.push([arrToYArray(v)]);
    } else if (v !== null && typeof v === "object" && !(v instanceof Y.Map) && !(v instanceof Y.Array)) {
      a.push([objToYMap(v as Record<string, unknown>)]);
    } else {
      a.push([v]);
    }
  }
  return a;
}

/** Recursively convert Y.Map to plain object */
function yMapToObj(ymap: Y.Map<unknown>): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  ymap.forEach((v, k) => {
    if (v instanceof Y.Map) {
      obj[k] = yMapToObj(v);
    } else if (v instanceof Y.Array) {
      obj[k] = yArrayToArr(v);
    } else {
      obj[k] = v;
    }
  });
  return obj;
}

/** Recursively convert Y.Array to plain array */
function yArrayToArr(yarr: Y.Array<unknown>): unknown[] {
  return yarr.toArray().map((v) => {
    if (v instanceof Y.Map) return yMapToObj(v);
    if (v instanceof Y.Array) return yArrayToArr(v);
    return v;
  });
}

/** Initialize Y.Doc with presentation data */
export function initYDocFromPresentation(doc: Y.Doc, presentation: Presentation): void {
  const root = doc.getMap("presentation");
  root.set("theme", objToYMap(presentation.theme as unknown as Record<string, unknown>));
  root.set("slides", arrToYArray(presentation.slides as unknown[]));
}

/** Read Presentation from Y.Doc */
export function presentationFromYDoc(doc: Y.Doc): Presentation {
  const root = doc.getMap("presentation");
  const theme = root.get("theme");
  const slides = root.get("slides");
  return {
    theme: theme instanceof Y.Map ? (yMapToObj(theme) as Presentation["theme"]) : { colorScheme: {} as Presentation["theme"]["colorScheme"], fontScheme: { headFont: "Calibri", bodyFont: "Calibri" } },
    slides: slides instanceof Y.Array ? (yArrayToArr(slides) as Presentation["slides"]) : [],
  };
}

/** Get the root Y.Map for direct mutations (used by sync layer) */
export function getPresentationRoot(doc: Y.Doc): Y.Map<unknown> {
  return doc.getMap("presentation");
}

/** Apply Presentation to existing Y.Doc (replace) */
export function applyPresentationToYDoc(doc: Y.Doc, presentation: Presentation): void {
  doc.transact(() => {
    const root = doc.getMap("presentation");
    root.clear();
    root.set("theme", objToYMap(presentation.theme as unknown as Record<string, unknown>));
    root.set("slides", arrToYArray(presentation.slides as unknown[]));
  });
}
