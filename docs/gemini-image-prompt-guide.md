# Gemini 2.5 Flash Image Generation Prompt Guide

This document captures compact, high‑adherence prompt patterns optimized for Gemini 2.5 Flash image generation. It is designed to replace long, prose-heavy “creative briefs” with structured directives that the model follows more reliably.

Scope
- Non-Freepik image generation flows in Content Studio (Gemini path).
- Both cases: without example image (text-to-image) and with example image (image+text).
- Integration point: [src/app/(authenticated)/content-studio/page.tsx](src/app/(authenticated)/content-studio/page.tsx)

Model notes (Gemini 2.5 Flash)
- Prefers concise, explicit constraints over long paragraphs.
- Responds well to uppercase, single-line “hard constraints” (e.g., ASPECT_RATIO=1:1 EXACT).
- Keep prompt under ~400–600 tokens; push specifics into compact lists instead of essays.
- Pass seed and other generation controls via API parameters when possible (not in the text).

Core principles
- Separate intent from constraints. Use sections: TASK, CONTEXT, STYLE, OUTPUT, AVOID, VARIATION.
- Keep “hard” requirements on their own lines and uppercase.
- Reduce platform trivia; enforce platform via ASPECT_RATIO and a single platform label.
- If batch > 1, add a single VARIATION_INDEX line; avoid paragraphs about batching.
- If a reference image is provided, ask the model to analyze but not output the analysis.

Template A — No example image (text-to-image)
Use when there is no reference image. Replace placeholders with actual values; omit optional lines when empty.

```
TASK: Generate a brand-aligned social image that stands out in feeds and supports conversion.

CONTEXT:
- Brand: "{brandDescription}"
- Industry: "{industryLabel}"        // omit if none
- Platform target: {platformLabel}   // e.g., Instagram
- Audience: {targetAudienceOptional} // optional

STYLE:
- Primary style: "{combinedStyle}"   // preset + custom notes
- Tone: {toneOptional}               // optional

OUTPUT (HARD CONSTRAINTS):
- ASPECT_RATIO={aspectRatio} EXACT
- QUALITY=MARKETING_GRADE
- NO_TEXT=TRUE
- WATERMARKS=NONE
- PEOPLE_CROP_RULE=APPLY            // no awkward face/body crops
- BACKGROUNDS=COHESIVE_AND_CLEAN

COMPOSITION:
- Clear subject focus; strong visual hierarchy; scroll-stopping framing.
- For people: natural pose, flattering lighting, no awkward crops.

AVOID:
{negativePromptLine}

VARIATION:
- VARIATION_INDEX={variationIndex}/{variationTotal} // include only when N>1
```

Template B — With example image (image+text)
Use when a reference image is provided to Gemini. The reference should be attached as input; the prompt instructs how to use it.

```
TASK: Create a new image for social media inspired by the provided reference—do not copy it.

REFERENCE ANALYSIS (DO, BUT DO NOT OUTPUT AS TEXT):
- Extract: subject type, composition/framing, lighting/mood, color palette, texture cues.
- Use these as stylistic inspiration only. Do NOT reproduce specific faces, logos, or unique IP.

CONTEXT:
- Brand: "{brandDescription}"
- Industry: "{industryLabel}"        // omit if none
- Platform target: {platformLabel}
- Audience: {targetAudienceOptional}  // optional

STYLE:
- Primary style: "{combinedStyle}"
- Tone: {toneOptional}                // optional

TRANSFORMATION RULES:
- Keep category and stylistic cues from the reference, but generate a fresh, original scene.
- Change at least one: camera angle, background setting, time-of-day, or color accents.
- No text overlays; no watermark-like artifacts.

OUTPUT (HARD CONSTRAINTS):
- ASPECT_RATIO={aspectRatio} EXACT
- QUALITY=MARKETING_GRADE
- NO_TEXT=TRUE
- WATERMARKS=NONE
- PEOPLE_CROP_RULE=APPLY

AVOID:
{negativePromptLine}

VARIATION:
- VARIATION_INDEX={variationIndex}/{variationTotal} // include only when N>1
```

Placeholder mapping
- {brandDescription}: from Brand Profile or form.
- {industryLabel}: derived label; omit if unset or “_none_”.
- {platformLabel}: single string (e.g., Instagram).
- {combinedStyle}: preset + custom style notes.
- {aspectRatio}: enforced via UI (e.g., 1:1, 16:9, 9:16).
- {negativePromptLine}: if user entered negative prompt, keep it one line; otherwise remove the AVOID block.
- {variationIndex}/{variationTotal}: include only when generating more than one image.

API/config guidance
- Pass seed, steps, guidance, and quality settings in API parameters when the SDK allows.
- Keep the text prompt free of parameter echoes like “Use seed: 1234”.
- When you synchronize platform → aspect ratio in the UI, do not repeat platform rules; rely on ASPECT_RATIO.

Integration notes
- The current prompt assembly happens in Content Studio: [src/app/(authenticated)/content-studio/page.tsx](src/app/(authenticated)/content-studio/page.tsx)
- For non-Freepik providers (Gemini path), replace the long paragraphs with Template A/B based on whether a reference image is present.
- Keep your existing logic that:
  - Builds combinedStyle from preset + custom notes.
  - Injects selected aspect ratio from the UI.
  - Adds a variation line only when numberOfImages > 1.

Optional helper (TypeScript skeleton)
This shows how you might centralize prompt construction. Adjust types/inputs to your codebase.

```ts
export type GeminiPromptInput = {
  brandDescription: string;
  industryLabel?: string;
  platformLabel?: string;
  targetAudience?: string;
  combinedStyle: string;
  tone?: string;
  aspectRatio: string; // "1:1" | "16:9" | ...
  negativePrompt?: string;
  batchIndex?: number;   // 1-based
  batchTotal?: number;   // N
  hasReferenceImage: boolean;
};

export function buildGeminiPrompt(i: GeminiPromptInput): string {
  const lines: string[] = [];
  if (!i.hasReferenceImage) {
    lines.push(
      "TASK: Generate a brand-aligned social image that stands out in feeds and supports conversion.",
      "",
      "CONTEXT:",
      `- Brand: "${i.brandDescription}"`,
      ...(i.industryLabel ? [`- Industry: "${i.industryLabel}"`] : []),
      ...(i.platformLabel ? [`- Platform target: ${i.platformLabel}`] : []),
      ...(i.targetAudience ? [`- Audience: ${i.targetAudience}`] : []),
      "",
      "STYLE:",
      `- Primary style: "${i.combinedStyle}"`,
      ...(i.tone ? [`- Tone: ${i.tone}`] : []),
      "",
      "OUTPUT (HARD CONSTRAINTS):",
      `- ASPECT_RATIO=${i.aspectRatio} EXACT`,
      "- QUALITY=MARKETING_GRADE",
      "- NO_TEXT=TRUE",
      "- WATERMARKS=NONE",
      "- PEOPLE_CROP_RULE=APPLY",
      "- BACKGROUNDS=COHESIVE_AND_CLEAN",
      "",
      "COMPOSITION:",
      "- Clear subject focus; strong visual hierarchy; scroll-stopping framing.",
      "- For people: natural pose, flattering lighting, no awkward crops."
    );
  } else {
    lines.push(
      "TASK: Create a new image for social media inspired by the provided reference—do not copy it.",
      "",
      "REFERENCE ANALYSIS (DO, BUT DO NOT OUTPUT AS TEXT):",
      "- Extract: subject, composition/framing, lighting/mood, palette, texture cues.",
      "- Use as stylistic inspiration only; do NOT reproduce unique IP.",
      "",
      "CONTEXT:",
      `- Brand: "${i.brandDescription}"`,
      ...(i.industryLabel ? [`- Industry: "${i.industryLabel}"`] : []),
      ...(i.platformLabel ? [`- Platform target: ${i.platformLabel}`] : []),
      ...(i.targetAudience ? [`- Audience: ${i.targetAudience}`] : []),
      "",
      "STYLE:",
      `- Primary style: "${i.combinedStyle}"`,
      ...(i.tone ? [`- Tone: ${i.tone}`] : []),
      "",
      "TRANSFORMATION RULES:",
      "- Keep category/style cues; generate a fresh, original scene.",
      "- Change ≥1 of: camera angle, background, time-of-day, color accents.",
      "- No text overlays; no watermark-like artifacts."
    );
  }

  lines.push(
    "",
    "OUTPUT (HARD CONSTRAINTS):",
    `- ASPECT_RATIO=${i.aspectRatio} EXACT`,
    "- QUALITY=MARKETING_GRADE",
    "- NO_TEXT=TRUE",
    "- WATERMARKS=NONE",
    "- PEOPLE_CROP_RULE=APPLY"
  );

  if (i.negativePrompt && i.negativePrompt.trim()) {
    lines.push("", "AVOID:", i.negativePrompt.trim());
  }

  if (i.batchTotal && i.batchTotal > 1 && i.batchIndex && i.batchIndex >= 1) {
    lines.push("", "VARIATION:", `- VARIATION_INDEX=${i.batchIndex}/${i.batchTotal}`);
  }
  return lines.join("\n");
}
```

Freepik (Imagen3) note
- The above templates are for Gemini/non-Freepik. Keep Freepik structural parameters in their existing UI/metadata path and avoid mixing them into the Gemini text prompt.

Change log
- 2025-09-26: Initial version based on prompt review and alignment to Gemini 2.5 Flash.