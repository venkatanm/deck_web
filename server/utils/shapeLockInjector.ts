/**
 * Shape Lock Injector - Post-processes PPTX zip to inject OpenXML lock properties.
 * When isLocked === true on an element, injects spLocks/picLocks/graphicFrameLocks
 * into the shape's Non-Visual Properties so PowerPoint enforces the lock.
 */

import type JSZip from "jszip";

const SP_LOCKS =
  '<a:spLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noGrp="1" noSelect="1" noRot="1" noChangeAspect="1" noMove="1" noResize="1"/>';
const PIC_LOCKS =
  '<a:picLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noGrp="1" noSelect="1" noRot="1" noChangeAspect="1" noMove="1" noResize="1"/>';
const GRAPHIC_FRAME_LOCKS =
  '<a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noGrp="1" noSelect="1" noChangeAspect="1" noMove="1" noResize="1"/>';

/**
 * Inject shape locks into the PPTX zip for elements whose IDs are in lockedElementIds.
 * Uses objectName (cNvPr name attribute) to find shapes. Call after PptxGenJS write.
 */
export async function injectShapeLocks(
  zip: JSZip,
  lockedElementIds: Set<string>
): Promise<void> {
  if (lockedElementIds.size === 0) return;

  const slideFiles = Object.keys(zip.files).filter(
    (p) => p.match(/^ppt\/slides\/slide\d+\.xml$/) != null
  );

  for (const path of slideFiles) {
    const content = await zip.file(path)?.async("string");
    if (!content) continue;

    let modified = content;

    for (const elementId of lockedElementIds) {
      // Escape for regex (element IDs may contain special chars like -)
      const escaped = elementId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      // p:sp (shapes, text) - cNvSpPr contains a:spLocks
      modified = injectIntoSp(modified, escaped);
      // p:pic (images) - cNvPicPr contains a:picLocks
      modified = injectIntoPic(modified, escaped);
      // p:graphicFrame (charts) - cNvGraphicFramePr contains a:graphicFrameLocks
      modified = injectIntoGraphicFrame(modified, escaped);
    }

    if (modified !== content) {
      zip.file(path, modified);
    }
  }
}

function injectIntoSp(xml: string, escapedId: string): string {
  // Replace empty <p:cNvSpPr/> with locks when preceded by matching cNvPr
  const emptySp = new RegExp(
    `(<p:cNvPr[^>]*name="${escapedId}"[^>]*/?>)\\s*<p:cNvSpPr\\s*/>`,
    "g"
  );
  return xml.replace(emptySp, `$1\n    <p:cNvSpPr>${SP_LOCKS}</p:cNvSpPr>`);
}

function injectIntoPic(xml: string, escapedId: string): string {
  const emptyPic = new RegExp(
    `(<p:cNvPr[^>]*name="${escapedId}"[^>]*/?>)\\s*<p:cNvPicPr\\s*/>`,
    "g"
  );
  return xml.replace(emptyPic, `$1\n    <p:cNvPicPr>${PIC_LOCKS}</p:cNvPicPr>`);
}

function injectIntoGraphicFrame(xml: string, escapedId: string): string {
  const emptyGf = new RegExp(
    `(<p:cNvPr[^>]*name="${escapedId}"[^>]*/?>)\\s*<p:cNvGraphicFramePr\\s*/>`,
    "g"
  );
  return xml.replace(emptyGf, `$1\n    <p:cNvGraphicFramePr>${GRAPHIC_FRAME_LOCKS}</p:cNvGraphicFramePr>`);
}
