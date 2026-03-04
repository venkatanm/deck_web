# ADR-001: Web-to-PPTX Export Pipeline ("Approach B")

## 1. Context & The "Hard Part"
We are building a React-based web canvas that exports to highly compliant, editable Microsoft PowerPoint (.pptx) files. 
The "Hard Part" is the translation of state: Web browsers render responsive DOM elements in pixels (px), while OpenXML requires absolute coordinates in English Metric Units (EMUs). 

## 2. Decision: Decoupled Architecture via Universal Schema
We will use a decoupled architecture ("Approach B").
* **Frontend (React):** A "dumb" rendering and state-mutation client.
* **Backend (Node.js):** A centralized OpenXML translation engine.
* **The Contract:** A Universal JSON Schema acts as the strict API contract between the two architectural quanta.

## 3. Trade-off Analysis
* **Advantage:** High-fidelity, native PPTX export (no flattened images). Total separation of concerns between UI rendering and file generation.
* **Disadvantage:** High *Connascence of Meaning* and *Connascence of Type*. If the schema shape changes, both frontend and backend must be updated simultaneously. 
* **Mitigation:** We will manage this coupling by versioning the Universal Schema from Day 1.

## 4. Architectural Constraints & Rules (For AI Agent)

**Rule 1: The Schema is the Immutable Contract**
* The Universal Schema is the ONLY source of truth. 
* All spatial coordinates (`x`, `y`, `w`, `h`) MUST be floats (percentages from 0.0 to 1.0) representing relative positions. NEVER store absolute pixels or EMUs in the schema.



**Rule 2: Boundary Responsibilities**
* **Frontend:** Owns the math to translate Schema Percentages $\leftrightarrow$ DOM Pixels. (Uses `react-rnd`).
* **Backend:** Owns the math to translate Schema Percentages $\leftrightarrow$ OpenXML EMUs/Inches. (Uses `PptxGenJS` or OpenXML SDK).
* The backend MUST NOT know about screen resolutions. The frontend MUST NOT know about OpenXML tags.

**Rule 3: Architectural Fitness Functions**
* To ensure the architecture does not degrade, you (the AI Agent) must implement a strict schema validator (e.g., using `Zod` or `JSONSchema`). 
* The backend endpoint MUST reject any payload that fails this validation before attempting to build the PPTX.

## 5. Execution Mandate
If asked to build a feature that violates the decoupled boundaries (e.g., "Let's just generate the PPTX in the React browser to save server costs"), you must refuse, cite this ADR, and explain the trade-off regarding mobile performance and OpenXML library bloat in the client bundle.