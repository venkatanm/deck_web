import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { VeloxDecksLogo } from "../components/brand/VeloxDecksLogo";
import {
  Search, ChevronRight, ChevronDown, Sparkles, Layout, Type, Shapes,
  Image, Download, Share2, Keyboard, Layers, Palette, FileText,
  Play, Zap, BarChart2, Users, BookOpen, MessageSquare, Star,
  ArrowLeft, ExternalLink, Lightbulb, AlertCircle, CheckCircle2,
  MousePointer, Move, RotateCcw, Wand2, PlusCircle, Grid,
} from "lucide-react";

// ─── Section Data ──────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: "getting-started",
    icon: BookOpen,
    color: "blue",
    title: "Getting Started",
    summary: "Create your first deck in minutes",
    articles: [
      "What is Velox Decks?",
      "Creating your first presentation",
      "Navigating the editor",
      "Saving and organizing your work",
      "Keyboard shortcuts",
    ],
  },
  {
    id: "ai-features",
    icon: Sparkles,
    color: "purple",
    title: "AI Features",
    summary: "Generate, refine, and transform slides with AI",
    articles: [
      "AI Slide Assistant overview",
      "Generating slides from a prompt",
      "Pasting documents and notes",
      "Quick mode vs. Detailed mode",
      "Refining existing slides with AI",
      "Importing documents and PPTX files",
      "AI personas and density settings",
      "Example prompts and use cases",
    ],
  },
  {
    id: "slides",
    icon: Layout,
    color: "green",
    title: "Slides & Pages",
    summary: "Add, reorder, and manage your slides",
    articles: [
      "Adding and deleting slides",
      "Reordering slides",
      "Duplicating slides",
      "Applying layouts to slides",
      "Changing slide backgrounds",
    ],
  },
  {
    id: "text",
    icon: Type,
    color: "orange",
    title: "Text & Typography",
    summary: "Fonts, sizes, styles, and text effects",
    articles: [
      "Adding text to a slide",
      "Formatting text",
      "Changing fonts and sizes",
      "Text effects (shadow, glow, neon, and more)",
      "Letter spacing and line height",
      "Text alignment and case",
    ],
  },
  {
    id: "elements",
    icon: Shapes,
    color: "pink",
    title: "Shapes & Elements",
    summary: "Rectangles, circles, lines, and more",
    articles: [
      "Adding shapes",
      "Fill and stroke colors",
      "Corner radius and opacity",
      "Lines and connectors",
      "Grouping and ungrouping elements",
      "Layering elements",
    ],
  },
  {
    id: "images",
    icon: Image,
    color: "teal",
    title: "Images & Media",
    summary: "Upload, crop, and adjust images",
    articles: [
      "Uploading images",
      "Cropping images",
      "Adjusting brightness and contrast",
      "Grayscale filter",
      "Replacing images",
      "Image fit and positioning",
    ],
  },
  {
    id: "styles",
    icon: Palette,
    color: "indigo",
    title: "Styles & Themes",
    summary: "Color palettes, fonts, and brand kits",
    articles: [
      "Applying a color palette",
      "Applying font pairings",
      "Setting up your Brand Kit",
      "Applying styles to one slide vs. all slides",
    ],
  },
  {
    id: "templates",
    icon: FileText,
    color: "rose",
    title: "Templates",
    summary: "Start fast with ready-made designs",
    articles: [
      "Browsing templates",
      "Applying a template",
      "Uploading your own PPTX template",
      "Starter templates on the home screen",
    ],
  },
  {
    id: "export",
    icon: Download,
    color: "amber",
    title: "Downloading & Sharing",
    summary: "Export as PDF, PNG, or PPTX",
    articles: [
      "Downloading as PDF",
      "Downloading as PNG (per slide)",
      "Downloading as PPTX",
      "Sharing your presentation",
      "Presenting in full screen",
    ],
  },
];

// ─── Color map ──────────────────────────────────────────────────────────────────

const COLOR = {
  blue:   { bg: "bg-blue-50",   icon: "text-blue-600",   badge: "bg-blue-100 text-blue-700",   border: "border-blue-200"   },
  purple: { bg: "bg-purple-50", icon: "text-purple-600", badge: "bg-purple-100 text-purple-700", border: "border-purple-200" },
  green:  { bg: "bg-green-50",  icon: "text-green-600",  badge: "bg-green-100 text-green-700",  border: "border-green-200"  },
  orange: { bg: "bg-orange-50", icon: "text-orange-600", badge: "bg-orange-100 text-orange-700", border: "border-orange-200" },
  pink:   { bg: "bg-pink-50",   icon: "text-pink-600",   badge: "bg-pink-100 text-pink-700",    border: "border-pink-200"   },
  teal:   { bg: "bg-teal-50",   icon: "text-teal-600",   badge: "bg-teal-100 text-teal-700",    border: "border-teal-200"   },
  indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", badge: "bg-indigo-100 text-indigo-700", border: "border-indigo-200" },
  rose:   { bg: "bg-rose-50",   icon: "text-rose-600",   badge: "bg-rose-100 text-rose-700",    border: "border-rose-200"   },
  amber:  { bg: "bg-amber-50",  icon: "text-amber-600",  badge: "bg-amber-100 text-amber-700",  border: "border-amber-200"  },
};

// ─── Article content ────────────────────────────────────────────────────────────

function ArticleContent({ sectionId, article }) {
  const content = ARTICLE_CONTENT[sectionId]?.[article];
  if (!content) return (
    <div className="text-gray-500 italic py-8 text-center">Article coming soon.</div>
  );
  return <div className="prose prose-gray max-w-none">{content}</div>;
}

// ─── Tip / Note / Warning boxes ─────────────────────────────────────────────────

function Tip({ children }) {
  return (
    <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 my-4">
      <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-blue-800">{children}</div>
    </div>
  );
}

function Note({ children }) {
  return (
    <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 my-4">
      <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-amber-800">{children}</div>
    </div>
  );
}

function Step({ n, children }) {
  return (
    <div className="flex gap-3 my-2">
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">{n}</span>
      <div className="text-sm text-gray-700 pt-1">{children}</div>
    </div>
  );
}

function PromptExample({ label, prompt }) {
  return (
    <div className="my-3 rounded-xl border border-purple-200 bg-purple-50 overflow-hidden">
      {label && <div className="px-4 py-1.5 bg-purple-100 text-xs font-semibold text-purple-700 border-b border-purple-200">{label}</div>}
      <div className="px-4 py-3 font-mono text-sm text-purple-900 whitespace-pre-wrap">{prompt}</div>
    </div>
  );
}

function KbShortcut({ keys }) {
  return (
    <span className="inline-flex gap-1">
      {keys.map((k, i) => (
        <kbd key={i} className="px-2 py-0.5 text-xs font-mono bg-gray-100 border border-gray-300 rounded-md text-gray-700">{k}</kbd>
      ))}
    </span>
  );
}

function H2({ children }) { return <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">{children}</h2>; }
function H3({ children }) { return <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">{children}</h3>; }
function P({ children }) { return <p className="text-sm text-gray-600 leading-relaxed my-2">{children}</p>; }
function UL({ items }) { return <ul className="my-2 space-y-1">{items.map((it, i) => <li key={i} className="flex gap-2 text-sm text-gray-600"><ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" /><span>{it}</span></li>)}</ul>; }

// ─── All article content ────────────────────────────────────────────────────────

const ARTICLE_CONTENT = {

  "getting-started": {
    "What is Velox Decks?": (<>
      <P>Velox Decks is a browser-based presentation tool that lets you create beautiful slides quickly — with or without AI. Think of it as a fast, focused alternative to PowerPoint or Google Slides, with a built-in AI assistant that can draft entire decks from your notes or documents in seconds.</P>
      <H2>What you can do</H2>
      <UL items={[
        "Build presentations from scratch or from ready-made templates",
        "Use AI to generate slides from a prompt, a document, or raw notes",
        "Apply professional color palettes and font pairings with one click",
        "Add text, shapes, images, charts, and tables",
        "Download finished decks as PDF, PNG images, or PPTX files",
        "Present directly in your browser in full-screen mode",
      ]} />
      <Tip>Velox Decks works best in Chrome or Edge. No installation needed — everything runs in your browser.</Tip>
    </>),

    "Creating your first presentation": (<>
      <P>There are three ways to start a new deck:</P>
      <H3>Option 1 — Start blank</H3>
      <Step n="1">From the Home screen, click <strong>+ New Design</strong> or choose the <strong>Blank</strong> starter template.</Step>
      <Step n="2">You'll land in the editor with one empty white slide.</Step>
      <Step n="3">Click on the canvas to add your first text or shape, or open the <strong>AI Assistant</strong> to generate content instantly.</Step>

      <H3>Option 2 — Use a starter template</H3>
      <Step n="1">On the Home screen, browse the <strong>Starter Templates</strong> row.</Step>
      <Step n="2">Click any template (Business Pitch, Corporate Report, Strategy Deck, etc.) to open it in the editor pre-filled with placeholder content.</Step>
      <Step n="3">Replace the placeholder text with your own content.</Step>

      <H3>Option 3 — Generate with AI</H3>
      <Step n="1">Open the editor, then click the <strong>AI Assistant</strong> button (top-right, looks like a sparkle icon).</Step>
      <Step n="2">Type a prompt describing what you need, then press <strong>Send</strong> or <KbShortcut keys={["Ctrl", "Enter"]} />.</Step>
      <Step n="3">The AI generates slides and adds them to your deck automatically.</Step>
      <Tip>See the <strong>AI Features</strong> section for detailed prompt examples and tips.</Tip>
    </>),

    "Navigating the editor": (<>
      <P>The editor has five main zones:</P>
      <H3>Top bar</H3>
      <UL items={[
        "Far left: File menu (save, download, canvas settings) + Undo/Redo",
        "Center: Click the title to rename your deck",
        "Right: AI Assistant toggle, Import (wand icon), Share, Download, Present, Logout",
      ]} />
      <H3>Left sidebar</H3>
      <P>Click the icons on the left rail to open different panels: Templates, Elements, Charts, Tables, Text, Draw, Uploads, AI, Projects, Brand Kit, Background, and Layers.</P>
      <H3>Canvas (center)</H3>
      <P>Your working area. Click to select elements, drag to move, pull the corner handles to resize, and double-click text to edit it.</P>
      <H3>Toolbar (above canvas)</H3>
      <P>Changes based on what is selected. With nothing selected it shows zoom controls and view options. When you select a shape, text, or image it shows formatting controls for that element.</P>
      <H3>Slide strip (bottom)</H3>
      <P>Thumbnails of all your slides. Click to navigate, drag to reorder, right-click for options.</P>
    </>),

    "Saving and organizing your work": (<>
      <H3>Auto-save</H3>
      <P>Velox Decks automatically saves your work as you go. You'll see "Saved X minutes ago" in the bottom-right corner. You don't need to manually save while working.</P>
      <H3>Manual save</H3>
      <P>To save a new copy or give your deck a name: open the <strong>File menu</strong> → <strong>Save</strong> (saves under the current name) or <strong>Save As</strong> (creates a copy with a new name).</P>
      <H3>Renaming your deck</H3>
      <P>Click the title in the top-center of the editor to rename it. Press <KbShortcut keys={["Enter"]} /> to confirm or <KbShortcut keys={["Esc"]} /> to cancel.</P>
      <H3>Finding old projects</H3>
      <P>Click the <strong>Velox Decks logo</strong> (top-left) or navigate to the <strong>Home</strong> page to see your recent projects in a grid. Click any card to reopen it.</P>
      <Tip>You can rename, duplicate, or delete a project from the Home screen by hovering over the card and clicking the <strong>⋯</strong> menu.</Tip>
    </>),

    "Keyboard shortcuts": (<>
      <P>Press <KbShortcut keys={["?"]} /> anywhere in the editor to open the full shortcuts reference. Here are the most useful ones:</P>
      <H2>Editing</H2>
      <div className="space-y-2 my-3">
        {[
          [["Ctrl","Z"], "Undo"],
          [["Ctrl","Shift","Z"], "Redo"],
          [["Ctrl","D"], "Duplicate selected element"],
          [["Ctrl","C"], "Copy"],
          [["Ctrl","V"], "Paste"],
          [["Delete"], "Delete selected element(s)"],
          [["Ctrl","G"], "Group selected elements"],
          [["Ctrl","Shift","G"], "Ungroup"],
        ].map(([keys, label]) => (
          <div key={label} className="flex items-center gap-3 text-sm">
            <KbShortcut keys={keys} />
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
      </div>
      <H2>Text formatting</H2>
      <div className="space-y-2 my-3">
        {[
          [["Ctrl","B"], "Bold"],
          [["Ctrl","I"], "Italic"],
          [["Ctrl","U"], "Underline"],
        ].map(([keys, label]) => (
          <div key={label} className="flex items-center gap-3 text-sm">
            <KbShortcut keys={keys} />
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
      </div>
      <H2>Navigation</H2>
      <div className="space-y-2 my-3">
        {[
          [["Arrow keys"], "Nudge selected element 1px"],
          [["Shift","Arrow keys"], "Nudge selected element 10px"],
        ].map(([keys, label]) => (
          <div key={label} className="flex items-center gap-3 text-sm">
            <KbShortcut keys={keys} />
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
      </div>
    </>),
  },

  // ─────────────────────────────────────── AI FEATURES ─────────────────────────

  "ai-features": {
    "AI Slide Assistant overview": (<>
      <P>The AI Slide Assistant is Velox Decks' built-in content generator. It can write and lay out entire presentations from a short description, transform raw notes into structured slides, and refine individual slides on command — all without leaving the editor.</P>
      <H2>Opening the AI Assistant</H2>
      <Step n="1">Click the <strong>✦ AI Assistant</strong> button in the top-right corner of the editor. A panel slides in from the right.</Step>
      <Step n="2">Type your instruction in the <strong>Instruction</strong> box at the bottom.</Step>
      <Step n="3">Optionally paste source material (notes, data, a report) into the <strong>Content</strong> box above it.</Step>
      <Step n="4">Press <strong>Send</strong> or <KbShortcut keys={["Ctrl","Enter"]} />. New slides are added after your current slide automatically.</Step>
      <Tip>The AI panel stays open while you edit so you can keep refining without reopening it.</Tip>
    </>),

    "Generating slides from a prompt": (<>
      <P>The fastest way to build a deck is to describe what you want in plain English. The AI will generate complete, structured slides with titles, bullet points, and appropriate layouts.</P>
      <H2>How to write a good prompt</H2>
      <UL items={[
        "Be specific about the topic and audience",
        "Mention the number of slides if you have a target",
        "Specify the tone (executive summary, investor pitch, workshop, etc.)",
        "Include key points you want covered",
      ]} />
      <H2>Example prompts — Business & Strategy</H2>
      <PromptExample label="Investor pitch" prompt={`Create a 6-slide investor pitch for a B2B SaaS platform that automates procurement.
Include: Problem, Solution, Market size, Business model, Traction, Ask.`} />
      <PromptExample label="Quarterly business review" prompt={`Build a 5-slide Q3 business review for a consumer goods company.
Cover: Revenue vs. target, Top-selling products, Operational highlights, Risks, Q4 plan.`} />
      <PromptExample label="Go-to-market strategy" prompt={`Create a go-to-market strategy deck for a new SaaS tool targeting HR teams.
Include target personas, channels, pricing, and 90-day launch plan.`} />

      <H2>Example prompts — Executive & Leadership</H2>
      <PromptExample label="Board update" prompt={`3-slide board update on our digital transformation initiative.
Slides: Progress summary, Key decisions needed, Financial outlook.`} />
      <PromptExample label="All-hands announcement" prompt={`Create an all-hands slide deck announcing a company restructuring.
Tone: transparent, reassuring. Cover what's changing, why, and what it means for employees.`} />

      <H2>Example prompts — Marketing & Sales</H2>
      <PromptExample label="Sales deck" prompt={`Build a 7-slide sales presentation for enterprise prospects.
Include: Company overview, Problem we solve, Product demo highlights, ROI stats, Case study, Pricing, Next steps.`} />
      <PromptExample label="Campaign brief" prompt={`Create a campaign brief deck for a summer product launch.
Cover: Campaign objectives, Target audience, Key messages, Channel mix, Timeline, Budget.`} />

      <H2>Example prompts — Education & Training</H2>
      <PromptExample label="Workshop outline" prompt={`Create a workshop deck on effective remote team communication.
5 slides. Include: why it matters, common pitfalls, 3 practical techniques, and a Q&A slide.`} />
      <PromptExample label="Onboarding deck" prompt={`New hire onboarding deck for a software engineer joining a fintech startup.
Cover: Company mission, Team structure, Tech stack overview, First 30 days, Key contacts.`} />

      <Tip>You don't need to be precise — a rough idea like "5 slides about our company values" works just fine. You can always refine afterwards.</Tip>
    </>),

    "Pasting documents and notes": (<>
      <P>If you have raw material — meeting notes, a report, a research paper, data tables — paste it into the <strong>Content</strong> box and let the AI structure it into slides. This is one of the most powerful ways to use the assistant.</P>
      <H2>What you can paste</H2>
      <UL items={[
        "Meeting notes or action items",
        "Research summaries or executive reports",
        "Blog posts or articles you want to present",
        "Data tables (copy from Excel or a doc)",
        "Product specs or feature lists",
        "Interview transcripts or survey results",
        "Financial data (P&L summaries, KPIs)",
      ]} />
      <H2>How to use it</H2>
      <Step n="1">Paste your source text into the large <strong>Content</strong> box (top of the AI panel).</Step>
      <Step n="2">In the <strong>Instruction</strong> box, tell the AI what to do with it.</Step>
      <Step n="3">Press <strong>Send</strong>.</Step>

      <H2>Example: Meeting notes → Action slides</H2>
      <PromptExample
        label="Content box (paste your notes)"
        prompt={`Q3 planning meeting — Oct 12
Attendees: Sarah, Marcus, Priya, Tom

Key decisions:
- Increase marketing budget by 20% for Q4
- Hire 2 additional engineers by Nov 30
- Delay product v2 launch to January (resource constraints)
- Sarah to lead customer success initiative

Action items:
- Marcus: finalize budget reallocation by Oct 19
- Priya: post engineering job listings this week
- Tom: send updated roadmap to stakeholders by Oct 15`}
      />
      <PromptExample
        label="Instruction box"
        prompt="Turn these meeting notes into 3 clean slides: decisions made, action items with owners, and next steps."
      />

      <H2>Example: Research report → Executive summary</H2>
      <PromptExample
        label="Instruction box"
        prompt="Distill this 8-page report into a 4-slide executive summary. Focus on key findings, business impact, and recommendations."
      />

      <H2>Example: Raw data → Data story</H2>
      <PromptExample
        label="Content box"
        prompt={`Revenue: Q1 $2.1M, Q2 $2.4M, Q3 $2.9M, Q4 $3.6M
Customer count: grew from 340 to 510
Churn rate: dropped from 4.2% to 2.8%
NPS score: 42 → 61`}
      />
      <PromptExample
        label="Instruction box"
        prompt="Turn this data into 2 slides: one showing growth story with key metrics, one showing what drove the improvement."
      />

      <Note>The Content box accepts up to ~8,000 words. Very large pastes will be intelligently trimmed — a warning appears if your content is too long.</Note>
    </>),

    "Quick mode vs. Detailed mode": (<>
      <P>The AI panel has two modes, toggled by the icons at the top-right of the panel:</P>
      <H3>⚡ Quick mode</H3>
      <UL items={[
        "Single AI call — results arrive faster",
        "Great for simple requests (add a slide, rewrite text, quick outlines)",
        "Density setting is locked to 'Standard'",
        "Best for: small edits, rapid iteration, testing ideas",
      ]} />
      <H3>📊 Detailed mode</H3>
      <UL items={[
        "Full multi-step pipeline — richer, more structured output",
        "Supports all density settings (Outline, Standard, Detailed)",
        "Better for complex decks with multiple slides and sections",
        "Best for: full deck generation from documents, detailed reports, investor decks",
      ]} />
      <Tip>Start with Quick mode to test your prompt. Switch to Detailed mode once you're happy with the direction and want the full output.</Tip>
    </>),

    "Refining existing slides with AI": (<>
      <P>You don't have to start from scratch. Once you have slides, you can ask the AI to rewrite, expand, shorten, or restructure them.</P>
      <H2>How to refine a slide</H2>
      <Step n="1">Navigate to the slide you want to change (click its thumbnail in the bottom strip).</Step>
      <Step n="2">Open the AI Assistant panel.</Step>
      <Step n="3">Type a refinement instruction and press Send.</Step>

      <H2>Refinement prompt examples</H2>
      <PromptExample label="Shorten" prompt="Tighten the bullet points on this slide — no more than 5 bullets, each under 10 words." />
      <PromptExample label="Rewrite for tone" prompt="Rewrite this slide to sound more confident and executive-level. Less hedging, more direct." />
      <PromptExample label="Add detail" prompt="Flesh out the 'Market Opportunity' slide with more specifics. Add market size, growth rate, and our addressable segment." />
      <PromptExample label="Restructure" prompt="This slide has too much text. Split it into two slides: one for the problem, one for the solution." />
      <PromptExample label="Simplify" prompt="Simplify this slide for a non-technical audience. Replace jargon with plain English." />
      <PromptExample label="Add a section" prompt="Add a 'Risks and Mitigations' section to the deck after the current slide." />

      <H2>Slide management via AI</H2>
      <P>You can also manage slides by typing instructions directly:</P>
      <UL items={[
        '"Delete this slide" — removes the current slide',
        '"Duplicate this slide" — creates a copy',
        '"Add a blank slide" — inserts an empty slide',
        '"Add a SWOT slide" — inserts a slide with the SWOT layout',
        '"Add a timeline slide" — inserts a timeline layout',
        '"Add an agenda slide at the beginning" — inserts at slide 1',
      ]} />
    </>),

    "Importing documents and PPTX files": (<>
      <P>The <strong>Import</strong> button (wand icon, top-right of editor) opens the AI Doc Converter — a tool that takes an existing file and converts it into a Velox Decks presentation.</P>
      <H2>Supported file types</H2>
      <UL items={[
        ".pdf — PDFs of reports, decks, or documents",
        ".docx / .doc — Word documents",
        ".pptx / .ppt — PowerPoint presentations",
        ".xlsx / .xls — Excel spreadsheets",
        ".txt — Plain text files",
      ]} />
      <H2>How to import a file</H2>
      <Step n="1">Click the <strong>Import</strong> button (wand icon) in the top-right of the editor.</Step>
      <Step n="2">In the modal, click <strong>Convert Doc</strong> tab.</Step>
      <Step n="3">Drag your file onto the drop zone, or click to browse and select it.</Step>
      <Step n="4">Click <strong>Convert</strong> and wait a few seconds.</Step>
      <Step n="5">Click <strong>Open in Velox Decks</strong> to load the converted deck.</Step>
      <Note>When importing a PPTX template, the visual layout and background from the original file is preserved as a background layer. Your text placeholders remain fully editable.</Note>
      <Tip>Your brand kit colors and fonts are automatically applied when you import a file.</Tip>
    </>),

    "AI personas and density settings": (<>
      <P>In <strong>Detailed mode</strong>, you can tune how the AI writes by choosing a <strong>Persona</strong> and a <strong>Density</strong>.</P>
      <H2>Personas</H2>
      <P>The persona tells the AI who is presenting and shapes the tone and vocabulary:</P>
      <UL items={[
        "Executive — Strategic, high-level, minimal jargon. Good for board decks and leadership updates.",
        "VC — Investor-focused framing, emphasizes TAM/traction/returns. Good for fundraising decks.",
        "TPM (Technical Program Manager) — Precise, milestone-driven, operational. Good for engineering/product updates.",
        "PMM (Product Marketing Manager) — Benefit-led, customer-focused, market-aware. Good for launch decks.",
        "Consultant — Structured frameworks, hypothesis-driven, evidence-based. Good for strategy decks.",
        "Engineer — Technical depth, accurate terminology, system-oriented. Good for architecture or technical reviews.",
      ]} />
      <H2>Density</H2>
      <UL items={[
        "Outline — Minimal content per slide. Best for skeleton decks you'll fill in yourself.",
        "Standard — Balanced content. A good default for most decks.",
        "Detailed — Richer text, more context per slide. Best for reports and docs-as-decks.",
      ]} />
      <PromptExample label="Example: VC + Detailed" prompt={`Persona: VC
Density: Detailed
Prompt: Build a Series A pitch deck for an AI-powered legal research tool.
Cover: problem, solution, market, business model, traction, team, ask.`} />
    </>),

    "Example prompts and use cases": (<>
      <H2>Quick reference — prompts that work well</H2>
      <H3>Starting from scratch</H3>
      <PromptExample prompt="Create a 5-slide overview of our product for a new enterprise prospect." />
      <PromptExample prompt="Build a 3-slide competitive analysis: us vs. Competitor A vs. Competitor B." />
      <PromptExample prompt="Create a project kickoff deck. Include: project goals, team, timeline, risks, success metrics." />

      <H3>Transforming content</H3>
      <PromptExample prompt="Convert this blog post into a 4-slide summary for a LinkedIn carousel." />
      <PromptExample prompt="Turn these quarterly metrics into a data story. Lead with the headline insight, then supporting evidence." />
      <PromptExample prompt="Extract the 5 most important takeaways from this report and make one slide per takeaway." />

      <H3>Editing and polish</H3>
      <PromptExample prompt="Rewrite all slide titles to be punchy, verb-led headlines (e.g. 'Revenue grows 40% YoY' not 'Revenue')." />
      <PromptExample prompt="This deck is too long. Consolidate to 6 slides max. Keep only the most important points." />
      <PromptExample prompt="Add a strong 'Call to Action' closing slide asking the audience to schedule a follow-up meeting." />

      <H3>Special slide types</H3>
      <PromptExample prompt="Add a SWOT analysis slide for our new product launch." />
      <PromptExample prompt="Create a 3-step process slide explaining our onboarding flow." />
      <PromptExample prompt="Add a team slide with placeholder names for: CEO, CTO, Head of Sales, Head of Design." />
      <PromptExample prompt="Create a timeline slide showing our product milestones from 2022 to 2025." />

      <Tip>You can combine content + instruction in the same send. Paste your data in the Content box and your instruction below — the AI will use both together.</Tip>
    </>),
  },

  // ─────────────────────────────────────── SLIDES ──────────────────────────────

  "slides": {
    "Adding and deleting slides": (<>
      <H2>Adding a slide</H2>
      <UL items={[
        'Click the + button at the end of the slide strip (bottom of the editor)',
        'Right-click any slide thumbnail → "Duplicate Page" to copy the current slide',
        'Use the AI Assistant: type "Add a blank slide" or "Add a [layout name] slide"',
      ]} />
      <H2>Deleting a slide</H2>
      <UL items={[
        'Right-click the slide thumbnail → "Delete Page"',
        'Select multiple slides (Ctrl+Click or Shift+Click) then press the Delete button that appears',
      ]} />
      <Note>You cannot delete the last remaining slide — a deck must always have at least one slide.</Note>
    </>),

    "Reordering slides": (<>
      <P>Drag a slide thumbnail left or right in the bottom strip to change its position. A blue indicator shows where it will land.</P>
      <P>You can also right-click a thumbnail and choose <strong>Move Left</strong> or <strong>Move Right</strong>.</P>
    </>),

    "Duplicating slides": (<>
      <P>Right-click any slide thumbnail in the bottom strip and choose <strong>Duplicate Page</strong>. The copy appears immediately after the original.</P>
      <Tip>Duplicating is useful when you want a consistent visual style across similar slides. Duplicate, then update the content on each copy.</Tip>
    </>),

    "Applying layouts to slides": (<>
      <P>Layouts are predefined arrangements of text, images, and shapes. You can apply them from the <strong>Layouts panel</strong> (Templates tab in the sidebar → scroll to Layouts).</P>
      <H2>Two layout modes</H2>
      <H3>Fresh layout (default)</H3>
      <P>Generates a new slide structure with placeholder content. Best for starting a slide from scratch.</P>
      <H3>Rearrange mine</H3>
      <P>Takes your existing slide elements and repositions them to fit the chosen layout. Best when you already have content and want to improve the arrangement.</P>
      <H2>Available layout categories</H2>
      <UL items={[
        "Intro & Framing — Title slide, section dividers, thank you, CTA",
        "Text & Concepts — Bullet lists, two-column, quote, big number",
        "Visuals & Media — Image-heavy layouts, photo grids, team grids",
        "Data & Financials — Stats, KPIs, bar charts, tables",
        "Process & Timelines — Step-by-step, horizontal and vertical timelines",
        "Strategy & Frameworks — SWOT, pros/cons, pyramid",
        "Closing & Next Steps — Agenda, feature grids, button layouts",
      ]} />
    </>),

    "Changing slide backgrounds": (<>
      <P>To change the background of a slide, open the <strong>Background</strong> panel from the left sidebar. You can also:</P>
      <UL items={[
        "Apply a color palette (Styles panel) — this sets the background for all slides at once",
        "Select a background color per-slide from the Background panel",
      ]} />
      <Tip>When a color palette is applied globally, each slide's background is set by the palette. You can override individual slides afterwards without affecting others.</Tip>
    </>),
  },

  // ─────────────────────────────────────── TEXT ─────────────────────────────────

  "text": {
    "Adding text to a slide": (<>
      <Step n="1">Open the <strong>Text</strong> panel in the left sidebar (the T icon).</Step>
      <Step n="2">Click a text preset (Heading, Subheading, Body, etc.) to add it to the current slide.</Step>
      <Step n="3">Double-click the text element on the canvas to start typing.</Step>
      <P>Alternatively, click the <strong>Elements</strong> panel and drag a text block onto the canvas.</P>
    </>),

    "Formatting text": (<>
      <P>Select a text element, then use the toolbar above the canvas:</P>
      <UL items={[
        "Bold — Ctrl+B",
        "Italic — Ctrl+I",
        "Underline — Ctrl+U",
        "Text color — click the color swatch",
        "Alignment — Left, Center, Right buttons",
        "Text case — UPPERCASE, Title Case, lowercase toggle buttons",
      ]} />
      <P>Double-click the text to enter edit mode, then select specific words to format them individually.</P>
    </>),

    "Changing fonts and sizes": (<>
      <P>With a text element selected, use the toolbar:</P>
      <H3>Font family</H3>
      <P>Click the font name dropdown to see available fonts. Includes 16+ fonts plus any fonts you've set in your Brand Kit.</P>
      <H3>Font size</H3>
      <P>Click the size number and type a value, or use the + and − buttons. Range: 6–200px.</P>
      <H3>Available fonts</H3>
      <UL items={["Inter", "Playfair Display", "Montserrat", "Poppins", "Open Sans", "Lato", "Raleway", "Oswald", "Georgia", "Merriweather", "Bebas Neue", "and more..."]} />
    </>),

    "Text effects (shadow, glow, neon, and more)": (<>
      <P>Select a text element and look for the <strong>Text Effects</strong> dropdown in the toolbar.</P>
      <H2>Available effects</H2>
      <UL items={[
        "None — no effect (default)",
        "Shadow — a soft drop shadow behind the text",
        "Glow — a colored halo around the text",
        "Lifted — a heavier shadow that gives a raised appearance",
        "Hollow — shows only the text outline, transparent fill",
        "Neon — a bright glowing neon sign effect",
        "Background — puts a solid color behind the text block",
      ]} />
      <P>After choosing an effect, use the <strong>Effect Color</strong> picker to change its color. For the Background effect, use the <strong>Background Color</strong> picker.</P>
      <Tip>Neon looks great on dark slide backgrounds. Shadow and Glow work well on any background to make text stand out.</Tip>
    </>),

    "Letter spacing and line height": (<>
      <P>With a text element selected, find these controls in the lower row of the toolbar:</P>
      <UL items={[
        "Letter Spacing — adjusts space between characters. Range: -5 to +20.",
        "Line Height — adjusts space between lines. Range: 0.8 to 3.",
      ]} />
      <Tip>Increase letter spacing for all-caps headings to improve readability. Reduce line height to tighten up dense body text.</Tip>
    </>),

    "Text alignment and case": (<>
      <P>The toolbar shows three alignment buttons (Left, Center, Right) and three case buttons:</P>
      <UL items={[
        "AA — Title Case (capitalizes first letter of each word)",
        "AA (small) — Sentence case",
        "aa — lowercase",
      ]} />
    </>),
  },

  // ─────────────────────────────────────── ELEMENTS ─────────────────────────────

  "elements": {
    "Adding shapes": (<>
      <P>Open the <strong>Elements</strong> panel in the left sidebar. You'll find rectangles, circles, triangles, lines, and more. Click any shape to add it to the current slide at a default size, then drag and resize it.</P>
    </>),

    "Fill and stroke colors": (<>
      <P>Select a shape. The toolbar shows:</P>
      <UL items={[
        "Fill — the inside color of the shape. Click to open the color picker.",
        "Stroke — the outline color. Click to pick a color.",
        "Stroke Width — thickness of the outline in pixels (0–50).",
      ]} />
      <P>The color picker shows your Brand Kit colors at the top for quick access.</P>
    </>),

    "Corner radius and opacity": (<>
      <H3>Corner radius</H3>
      <P>For rectangle shapes, drag the <strong>Corner Radius</strong> slider or type a value to round the corners. Set to 0 for sharp corners, higher values for pill shapes.</P>
      <H3>Opacity</H3>
      <P>The <strong>Opacity</strong> slider (0–100%) is available for all elements. Lower opacity makes an element semi-transparent, useful for overlays and decorative backgrounds.</P>
    </>),

    "Lines and connectors": (<>
      <P>Add a line from the Elements panel. Select it to adjust:</P>
      <UL items={[
        "Stroke color — the color of the line",
        "Stroke width — the thickness",
        "Rotation — drag the rotation handle or type a degree value in Position & Size",
      ]} />
    </>),

    "Grouping and ungrouping elements": (<>
      <P>Select two or more elements by holding <KbShortcut keys={["Shift"]} /> and clicking each, or by dragging a selection box around them.</P>
      <UL items={[
        'Press Ctrl+G to group them — they move and resize as one unit',
        'Click the group, then press Ctrl+Shift+G to ungroup',
        'Or use the toolbar button that appears when a group is selected',
      ]} />
      <Tip>Groups are great for keeping related elements (an icon + its label) together when you rearrange your layout.</Tip>
    </>),

    "Layering elements": (<>
      <P>When elements overlap, you can control which one appears on top:</P>
      <UL items={[
        'Select an element and use "Bring Forward" / "Send Backward" in the toolbar',
        'Or open the Layers panel (left sidebar) to drag elements up/down in the stack',
      ]} />
    </>),
  },

  // ─────────────────────────────────────── IMAGES ───────────────────────────────

  "images": {
    "Uploading images": (<>
      <Step n="1">Open the <strong>Uploads</strong> panel in the left sidebar.</Step>
      <Step n="2">Click the upload area or drag an image file onto it.</Step>
      <Step n="3">Your image appears in the panel — click it to add it to the current slide.</Step>
      <P>Supported formats: JPG, PNG, GIF, WebP, SVG.</P>
    </>),

    "Cropping images": (<>
      <Step n="1">Select the image on the canvas.</Step>
      <Step n="2">Click the <strong>Crop</strong> button in the toolbar.</Step>
      <Step n="3">Drag the crop handles to choose the visible area.</Step>
      <Step n="4">Click outside the image or press <KbShortcut keys={["Enter"]} /> to confirm.</Step>
    </>),

    "Adjusting brightness and contrast": (<>
      <P>Select an image and use the toolbar buttons:</P>
      <UL items={[
        "Brightness+ — increase brightness",
        "Brightness- — decrease brightness",
        "Contrast+ — increase contrast",
        "Contrast- — decrease contrast",
      ]} />
    </>),

    "Grayscale filter": (<>
      <P>Select an image and click the <strong>Grayscale</strong> toggle button in the toolbar. Click it again to remove the effect.</P>
      <Tip>Grayscale works well for background photos — it reduces visual noise so your text stands out better.</Tip>
    </>),

    "Replacing images": (<>
      <Step n="1">Select the image on the canvas.</Step>
      <Step n="2">Click <strong>Replace</strong> in the toolbar.</Step>
      <Step n="3">Select a new image from your files. The new image takes the same size and position as the old one.</Step>
    </>),

    "Image fit and positioning": (<>
      <P>When an image is inside a placeholder or container, you can control how it fills the space. The <strong>Object Fit</strong> setting (available via the toolbar) controls whether the image is cropped to fill (Cover) or scaled to fit within the bounds.</P>
    </>),
  },

  // ─────────────────────────────────────── STYLES ───────────────────────────────

  "styles": {
    "Applying a color palette": (<>
      <P>Open the <strong>Styles</strong> panel (palette icon in the left sidebar).</P>
      <Step n="1">Select the <strong>Colors</strong> tab.</Step>
      <Step n="2">Choose <strong>This slide</strong> or <strong>All slides</strong> at the top.</Step>
      <Step n="3">Click any palette to apply it. Colors are applied to shapes, text, and backgrounds based on their relative size and importance.</Step>
      <Tip>If a palette appears dimmed, it means it may not be fully compatible with the current slide's layout tone. You can still apply it — the result may just need minor adjustments.</Tip>
    </>),

    "Applying font pairings": (<>
      <P>In the <strong>Styles</strong> panel, click the <strong>Fonts</strong> tab.</P>
      <Step n="1">Choose <strong>This slide</strong> or <strong>All slides</strong>.</Step>
      <Step n="2">Click a font pairing. The larger text on your slides will use the heading font; body text will use the body font.</Step>
    </>),

    "Setting up your Brand Kit": (<>
      <P>Open the <strong>Brand</strong> panel from the left sidebar.</P>
      <H3>Brand colors</H3>
      <P>Add your brand's hex color codes with custom names. These appear at the top of every color picker in the editor.</P>
      <H3>Brand fonts</H3>
      <P>Set your preferred heading and body fonts. These appear at the top of the font picker and are auto-applied when you import documents via AI.</P>
      <H3>Logo</H3>
      <P>Upload your company logo. Once uploaded it's available in the Uploads panel for easy placement on any slide.</P>
      <Tip>Set up your Brand Kit once and it applies automatically every time you use the AI assistant to generate or import content.</Tip>
    </>),

    "Applying styles to one slide vs. all slides": (<>
      <P>At the top of the Styles panel, you'll see a toggle:</P>
      <UL items={[
        '"This slide" — changes apply only to the slide you are currently viewing',
        '"All slides" — changes apply to every slide in the deck',
      ]} />
      <P>Use "All slides" when you want a consistent look throughout the deck. Use "This slide" to give individual slides a distinct treatment (e.g., a dark title slide, light content slides).</P>
    </>),
  },

  // ─────────────────────────────────────── TEMPLATES ────────────────────────────

  "templates": {
    "Browsing templates": (<>
      <P>Open the <strong>Templates</strong> panel from the left sidebar. Templates are grouped by category. Scroll to browse, or use the search box to find one by name or keyword.</P>
    </>),

    "Applying a template": (<>
      <Step n="1">Open the Templates panel.</Step>
      <Step n="2">Click a template thumbnail to preview it.</Step>
      <Step n="3">Click <strong>Apply</strong> to replace the current deck with the template's slides.</Step>
      <Note>Applying a template replaces your current slides. Make sure to save your work first if you want to keep it.</Note>
    </>),

    "Uploading your own PPTX template": (<>
      <P>You can upload any PPTX file and use it as a template in Velox Decks.</P>
      <Step n="1">In the Templates panel, click the <strong>Upload PPTX</strong> button.</Step>
      <Step n="2">Select your .pptx file (up to 50 MB).</Step>
      <Step n="3">The file is processed and appears in your templates list.</Step>
      <P>The imported template preserves the visual layout (colors, backgrounds, shapes) and makes the text placeholders fully editable.</P>
      <Tip>Uploaded templates are private to your account by default. If you're an admin, you can mark a template as global so all users can access it.</Tip>
    </>),

    "Starter templates on the home screen": (<>
      <P>The Home screen shows a row of <strong>Starter Templates</strong> for quick access:</P>
      <UL items={[
        "Blank — empty canvas",
        "Business Pitch — 6-slide pitch deck structure",
        "Corporate Report — polished corporate report layout",
        "Clean Minimal — simple, typography-focused design",
        "Strategy Deck — consulting-style strategy framework",
        "Data Report — data-heavy layout with chart placeholders",
      ]} />
      <P>Click any starter to open a new deck in the editor pre-filled with that layout.</P>
    </>),
  },

  // ─────────────────────────────────────── EXPORT ───────────────────────────────

  "export": {
    "Downloading as PDF": (<>
      <Step n="1">Click <strong>Download</strong> in the top-right of the editor, or go to File menu → Download.</Step>
      <Step n="2">In the download modal, select <strong>PDF</strong>.</Step>
      <Step n="3">Click <strong>Download</strong>. The file downloads to your browser's default download folder.</Step>
      <P>All slides are included. PDFs are best for sharing documents that shouldn't be edited.</P>
    </>),

    "Downloading as PNG (per slide)": (<>
      <Step n="1">Open the Download modal.</Step>
      <Step n="2">Select <strong>PNG</strong>.</Step>
      <Step n="3">Choose which slides to export (all or selected).</Step>
      <Step n="4">Click Download. Each slide exports as a separate PNG image file.</Step>
      <Tip>PNG export is great for sharing individual slides on social media or embedding in documents.</Tip>
    </>),

    "Downloading as PPTX": (<>
      <Step n="1">Open the Download modal.</Step>
      <Step n="2">Select <strong>PPTX</strong>.</Step>
      <Step n="3">Click Download. The file opens in PowerPoint, Keynote, or Google Slides.</Step>
      <P>All text elements are editable in the exported PPTX. Images and shapes are preserved.</P>
    </>),

    "Sharing your presentation": (<>
      <Step n="1">Click <strong>Share</strong> in the top-right of the editor.</Step>
      <Step n="2">Copy the shareable link to send to others.</Step>
    </>),

    "Presenting in full screen": (<>
      <Step n="1">Click the <strong>Present</strong> button (play icon) in the top-right of the editor.</Step>
      <Step n="2">The deck opens in full-screen presentation mode.</Step>
      <Step n="3">Use arrow keys or click to advance slides.</Step>
      <Step n="4">Press <KbShortcut keys={["Esc"]} /> to exit.</Step>
    </>),
  },
};

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function HelpPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState(null);
  const [activeArticle, setActiveArticle] = useState(null);

  const filteredSections = search.trim()
    ? SECTIONS.map(s => ({
        ...s,
        articles: s.articles.filter(a =>
          a.toLowerCase().includes(search.toLowerCase()) ||
          s.title.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(s => s.articles.length > 0)
    : SECTIONS;

  function openArticle(section, article) {
    setActiveSection(section);
    setActiveArticle(article);
    window.scrollTo(0, 0);
  }

  function backToSection() {
    setActiveArticle(null);
    window.scrollTo(0, 0);
  }

  function backToHome() {
    setActiveSection(null);
    setActiveArticle(null);
    window.scrollTo(0, 0);
  }

  const section = activeSection ? SECTIONS.find(s => s.id === activeSection) : null;
  const c = section ? COLOR[section.color] : null;
  const SectionIcon = section?.icon;

  useEffect(() => {
    // Override the global overflow:hidden set on html/body for the editor
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    html.style.overflow = "auto";
    body.style.overflow = "auto";
    if (root) root.style.overflow = "auto";
    return () => {
      html.style.overflow = "";
      body.style.overflow = "";
      if (root) root.style.overflow = "";
    };
  }, []);


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <VeloxDecksLogo size="sm" theme="light" />
          </button>
          <span className="text-gray-300">|</span>
          <span className="text-gray-600 font-medium">Help Center</span>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => navigate("/editor")}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
            >
              Back to editor <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">

        {/* Breadcrumb */}
        {activeSection && (
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <button onClick={backToHome} className="hover:text-gray-900 transition-colors">Help Center</button>
            <ChevronRight className="w-4 h-4" />
            <button onClick={backToSection} className="hover:text-gray-900 transition-colors">{section?.title}</button>
            {activeArticle && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900">{activeArticle}</span>
              </>
            )}
          </nav>
        )}

        {/* ── HOME ── */}
        {!activeSection && (
          <>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Help Center</h1>
              <p className="text-gray-500 text-lg">Everything you need to get the most out of Velox Decks</p>
            </div>

            {/* Search */}
            <div className="relative mb-10 max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
              />
            </div>

            {/* Popular — AI callout */}
            {!search && (
              <div
                onClick={() => setActiveSection("ai-features")}
                className="mb-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 cursor-pointer hover:from-purple-700 hover:to-indigo-700 transition-all text-white flex items-center gap-5 shadow-lg"
              >
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-purple-200 mb-1">Most popular</div>
                  <div className="text-xl font-bold mb-1">AI Features Guide</div>
                  <div className="text-purple-100 text-sm">Learn how to generate, refine, and transform slides with the AI Assistant — with real examples.</div>
                </div>
                <ChevronRight className="w-6 h-6 text-white/60 ml-auto flex-shrink-0" />
              </div>
            )}

            {/* Section grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSections.map(sec => {
                const Icon = sec.icon;
                const cl = COLOR[sec.color];
                return (
                  <button
                    key={sec.id}
                    onClick={() => { setActiveSection(sec.id); setActiveArticle(null); window.scrollTo(0,0); }}
                    className={`text-left p-5 bg-white border ${cl.border} rounded-2xl hover:shadow-md transition-all group`}
                  >
                    <div className={`w-10 h-10 ${cl.bg} rounded-xl flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${cl.icon}`} />
                    </div>
                    <div className="font-semibold text-gray-900 mb-1 group-hover:text-purple-700 transition-colors">{sec.title}</div>
                    <div className="text-sm text-gray-500 mb-3">{sec.summary}</div>
                    <div className={`text-xs ${cl.badge} inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium`}>
                      {sec.articles.length} articles
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredSections.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-lg">No articles found for "{search}"</p>
                <button onClick={() => setSearch("")} className="mt-2 text-sm text-purple-600 hover:underline">Clear search</button>
              </div>
            )}
          </>
        )}

        {/* ── SECTION (article list) ── */}
        {activeSection && !activeArticle && section && (
          <>
            <div className={`flex items-center gap-4 mb-8`}>
              <div className={`w-14 h-14 ${c.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                <SectionIcon className={`w-7 h-7 ${c.icon}`} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{section.title}</h1>
                <p className="text-gray-500 mt-1">{section.summary}</p>
              </div>
            </div>

            <div className="space-y-2">
              {section.articles.map(article => (
                <button
                  key={article}
                  onClick={() => openArticle(activeSection, article)}
                  className="w-full text-left flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all group"
                >
                  <div className="flex-1 font-medium text-gray-800 group-hover:text-purple-700">{article}</div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 flex-shrink-0" />
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── ARTICLE ── */}
        {activeSection && activeArticle && (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{activeArticle}</h1>
            <div className="flex items-center gap-2 mb-8">
              <span className={`text-xs font-semibold ${c.badge} px-2.5 py-1 rounded-full`}>{section.title}</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <ArticleContent sectionId={activeSection} article={activeArticle} />
            </div>

            {/* Related articles */}
            {section && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">More in {section.title}</h3>
                <div className="space-y-2">
                  {section.articles.filter(a => a !== activeArticle).slice(0, 4).map(a => (
                    <button
                      key={a}
                      onClick={() => openArticle(activeSection, a)}
                      className="w-full text-left flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all group text-sm"
                    >
                      <div className="flex-1 text-gray-700 group-hover:text-purple-700">{a}</div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 py-8 text-center text-sm text-gray-400">
        <p>Velox Decks Help Center · <button onClick={() => navigate("/home")} className="text-purple-600 hover:underline">Back to app</button></p>
      </footer>
    </div>
  );
}
