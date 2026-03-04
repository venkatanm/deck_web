/**
 * CANONICAL CONTENT SCHEMA v1
 *
 * This is the structure the AI pipeline outputs.
 * The Canva clone import engine reads this and
 * converts it to canvas elements.
 *
 * Supported slideTypes:
 *   cover            - Title slide
 *   stat-grid        - 2-4 KPI stat blocks
 *   chart            - Single chart with data
 *   bullets          - Headline + bullet points
 *   timeline         - Horizontal or vertical timeline
 *   section-divider  - Bold colored section break
 *   comparison       - Two values side by side
 *   quote            - Pull quote with attribution
 *   team             - Team member grid
 *   image-content    - Image left/right + text
 *   flowchart        - Process steps
 *   full-bleed-text  - Large centered statement
 */

export const CONTENT_SCHEMA_VERSION = "1.0";

// Validates a content schema object.
// Returns { valid: boolean, errors: string[] }
export function validateContentSchema(schema) {
  const errors = [];
  if (!schema.meta) errors.push("Missing meta field");
  if (!schema.meta?.title) errors.push("Missing meta.title");
  if (!Array.isArray(schema.slides)) errors.push("slides must be an array");
  schema.slides?.forEach((slide, i) => {
    if (!slide.slideType) errors.push(`Slide ${i}: missing slideType`);
    if (!slide.content) errors.push(`Slide ${i}: missing content`);
  });
  return { valid: errors.length === 0, errors };
}

// Maps documentType from pipeline to template id
// in the Canva clone
export const DOCUMENT_TYPE_TO_TEMPLATE = {
  earnings_report: "corporate-report",
  pitch_deck: "pitch-deck-dark",
  product_launch: "tech-product",
  consulting_deck: "consulting",
  lesson_plan: "educational",
  marketing_brief: "marketing-campaign",
  general: "minimalist-light",
};

// Example valid schema for testing the import engine:
export const EXAMPLE_CONTENT_SCHEMA = {
  version: "1.0",
  meta: {
    title: "Example Deck",
    documentType: "pitch_deck",
    suggestedTemplate: "pitch-deck-dark",
    slideCount: 5,
  },
  slides: [
    {
      slideType: "cover",
      content: {
        title: "Our Company",
        subtitle: "Changing how the world works",
        date: "March 2025",
      },
    },
    {
      slideType: "stat-grid",
      content: {
        headline: "Traction",
        stats: [
          { value: "$2.4M", label: "ARR", trend: "+340%", trendDir: "up" },
          { value: "12K", label: "Customers", trend: "+180%", trendDir: "up" },
          { value: "94%", label: "Retention", trend: "+2pts", trendDir: "up" },
        ],
      },
    },
    {
      slideType: "chart",
      content: {
        headline: "Revenue Growth",
        chartType: "bar",
        variant: "grouped",
        data: [
          { label: "Q1", actual: 320, target: 300 },
          { label: "Q2", actual: 380, target: 350 },
          { label: "Q3", actual: 440, target: 400 },
          { label: "Q4", actual: 520, target: 440 },
        ],
        series: [
          { key: "actual", name: "Actual" },
          { key: "target", name: "Target" },
        ],
      },
    },
    {
      slideType: "timeline",
      content: {
        headline: "Roadmap",
        items: [
          {
            label: "Q1 2025",
            sublabel: "Foundation",
            description: "Core platform launch",
            done: true,
          },
          {
            label: "Q2 2025",
            sublabel: "Growth",
            description: "10K customer milestone",
            done: false,
          },
          {
            label: "Q3 2025",
            sublabel: "Expansion",
            description: "International markets",
            done: false,
          },
        ],
      },
    },
    {
      slideType: "section-divider",
      content: {
        title: "Thank You",
        subtitle: "hello@company.com",
      },
    },
  ],
};
