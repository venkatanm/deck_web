/**
 * Slide Template Registry - Single Source of Truth for layout definitions.
 * Data-driven: supports 20+ layouts without hardcoded switch statements.
 */

import type { CanvasElement } from "@deck-web/schema";

export interface SlideTemplateDefinition {
  id: string;
  displayName: string;
  thumbnailIcon: string;
  elements: CanvasElement[];
}

function phId(role: string): string {
  return `ph-${role}`;
}

export const SLIDE_REGISTRY: Record<string, SlideTemplateDefinition> = {
  TITLE: {
    id: "TITLE",
    displayName: "Title Slide",
    thumbnailIcon: "Type",
    elements: [
      {
        id: phId("title"),
        type: "text",
        content: "",
        transform: { x: 0.05, y: 0.05, w: 0.9, h: 0.15, z: 0 },
        fontSize: 24,
        color: "dk1",
        placeholderRole: "title",
      },
      {
        id: phId("subTitle"),
        type: "text",
        content: "",
        transform: { x: 0.05, y: 0.22, w: 0.9, h: 0.15, z: 1 },
        fontSize: 14,
        color: "dk2",
        placeholderRole: "subTitle",
      },
    ],
  },

  TITLE_AND_CONTENT: {
    id: "TITLE_AND_CONTENT",
    displayName: "Title and Content",
    thumbnailIcon: "Layout",
    elements: [
      {
        id: phId("title"),
        type: "text",
        content: "",
        transform: { x: 0.05, y: 0.05, w: 0.9, h: 0.15, z: 0 },
        fontSize: 24,
        color: "dk1",
        placeholderRole: "title",
      },
      {
        id: phId("body"),
        type: "smartContainer",
        transform: { x: 0.05, y: 0.25, w: 0.9, h: 0.7, z: 1 },
        layoutConfig: {
          direction: "column",
          justifyContent: "flex-start",
          alignItems: "stretch",
          gap: 0.02,
          padding: 0.02,
        },
        elements: [],
        placeholderRole: "body",
      },
    ],
  },

  TWO_COLUMN: {
    id: "TWO_COLUMN",
    displayName: "Two Column Content",
    thumbnailIcon: "Columns",
    elements: [
      {
        id: phId("title"),
        type: "text",
        content: "",
        transform: { x: 0.05, y: 0.05, w: 0.9, h: 0.15, z: 0 },
        fontSize: 24,
        color: "dk1",
        placeholderRole: "title",
      },
      {
        id: phId("row"),
        type: "smartContainer",
        transform: { x: 0.05, y: 0.25, w: 0.9, h: 0.7, z: 1 },
        layoutConfig: {
          direction: "row",
          justifyContent: "space-between",
          alignItems: "stretch",
          gap: 0.02,
          padding: 0.02,
        },
        elements: [
          {
            id: phId("body"),
            type: "smartContainer",
            transform: { x: 0, y: 0, w: 0.48, h: 1, z: 0 },
            layoutConfig: {
              direction: "column",
              justifyContent: "flex-start",
              alignItems: "stretch",
              gap: 0.02,
              padding: 0.02,
            },
            elements: [],
            placeholderRole: "body",
          },
          {
            id: phId("body2"),
            type: "smartContainer",
            transform: { x: 0.5, y: 0, w: 0.48, h: 1, z: 0 },
            layoutConfig: {
              direction: "column",
              justifyContent: "flex-start",
              alignItems: "stretch",
              gap: 0.02,
              padding: 0.02,
            },
            elements: [],
            placeholderRole: "body2",
          },
        ],
      },
    ],
  },

  THREE_COLUMN: {
    id: "THREE_COLUMN",
    displayName: "Three Columns with Images",
    thumbnailIcon: "LayoutGrid",
    elements: [
      {
        id: phId("title"),
        type: "text",
        content: "",
        transform: { x: 0.05, y: 0.05, w: 0.9, h: 0.12, z: 0 },
        fontSize: 24,
        color: "dk1",
        placeholderRole: "title",
      },
      {
        id: phId("row"),
        type: "smartContainer",
        transform: { x: 0.05, y: 0.2, w: 0.9, h: 0.75, z: 1 },
        layoutConfig: {
          direction: "row",
          justifyContent: "space-between",
          alignItems: "stretch",
          gap: 0.02,
          padding: 0.02,
        },
        elements: [
          {
            id: phId("body"),
            type: "smartContainer",
            transform: { x: 0, y: 0, w: 0.31, h: 1, z: 0 },
            layoutConfig: {
              direction: "column",
              justifyContent: "flex-start",
              alignItems: "stretch",
              gap: 0.02,
              padding: 0.02,
            },
            elements: [],
            placeholderRole: "body",
          },
          {
            id: phId("body2"),
            type: "smartContainer",
            transform: { x: 0.34, y: 0, w: 0.31, h: 1, z: 0 },
            layoutConfig: {
              direction: "column",
              justifyContent: "flex-start",
              alignItems: "stretch",
              gap: 0.02,
              padding: 0.02,
            },
            elements: [],
            placeholderRole: "body2",
          },
          {
            id: phId("body3"),
            type: "smartContainer",
            transform: { x: 0.68, y: 0, w: 0.31, h: 1, z: 0 },
            layoutConfig: {
              direction: "column",
              justifyContent: "flex-start",
              alignItems: "stretch",
              gap: 0.02,
              padding: 0.02,
            },
            elements: [],
            placeholderRole: "body3",
          },
        ],
      },
    ],
  },

  QUOTE_CENTER: {
    id: "QUOTE_CENTER",
    displayName: "Quote Center",
    thumbnailIcon: "Quote",
    elements: [
      {
        id: phId("title"),
        type: "text",
        content: "",
        transform: { x: 0.1, y: 0.35, w: 0.8, h: 0.35, z: 0 },
        fontSize: 36,
        color: "dk1",
        placeholderRole: "title",
      },
      {
        id: phId("subTitle"),
        type: "text",
        content: "",
        transform: { x: 0.1, y: 0.72, w: 0.8, h: 0.15, z: 1 },
        fontSize: 14,
        color: "dk2",
        placeholderRole: "subTitle",
      },
    ],
  },

  BLANK: {
    id: "BLANK",
    displayName: "Blank",
    thumbnailIcon: "Square",
    elements: [],
  },
};
