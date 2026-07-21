# Renderer Contract

The renderer is a generic read-only explorer. Character facts belong in data, never in rendering code. The claim ledger and verification report are internal build-time truth artifacts, not runtime sidecars or normal user deliverables; the canvas document remains the readable renderer input.

## 1. Discover before building

Search the active workspace for a compatible renderer before creating one. A compatible renderer normally has:

- a data validator;
- a generic HTML template;
- Canvas or WebGL graph rendering;
- a build command accepting input data and output HTML;
- tests for references, interaction state, and offline bundling.

Do not hardcode a home directory. Resolve paths from the active workspace, skill directory, or explicit input.

## 2. Compatibility boundary

The existing canvas schema may keep certainty as a display label for older renderers. Its meaning is evidence presentation, not confidence probability. The claim ledger remains authoritative for claim type, evidence class, qualifiers, causality, and verification verdict.

New provenance and view-charter fields may be copied into canvas data as optional fields. Renderers must ignore unknown optional fields safely. New documents set `metadata.evidenceMode` to `anchored`. Old documents without `evidenceMode`, `evidence[].anchors`, a character brief, guide, provenance extension, or view charter must still open with their legacy evidence presentation.

When one subject needs a new concept:

- reusable concept: extend generic data and add validation and tests;
- subject fact: add data only;
- one-off character branch in renderer code: reject it.

No renderer branch may contain a character name, work title, route, episode name, or private path.

## 3. Required document capabilities

- metadata and subject;
- evidence records with safe HTTP or HTTPS links and optional global anchors;
- nodes, edges, groups, views, placements, and camera state;
- optional character brief;
- optional reader-facing continuity notes for localization changes, adaptation rewrites, script revisions, retcons, and unresolved contradictions;
- optional core guide;
- generic source scopes and reader-facing evidence labels;
- optional local visual assets embedded during build;
- deterministic IDs that can be matched to claim displayTargets.

When provenance extensions are present, preserve sourceTier, sourceClass, originGroup, scopeIds, visual version, credit, source page, and transformation.

When `characterBrief.continuityNotes` is non-empty, render it as a visible “版本改动” block in the character brief. Show the relation label, status, compared scopes, summary, evidence label, and source navigation. Use distinct text labels rather than color alone. The Chinese label for `retcon` is `追溯改写（俗称吃书）`; `contradiction-unresolved` is `矛盾未决`. These markers are essential content and must not exist only on hover or inside hidden metadata.

### Anchored evidence projection

When `metadata.evidenceMode` is `anchored`, each global `evidence[]` record may contain `anchors[]` entries with this exact shape:

    {
      "id": "anchor-id",
      "targetIds": ["node-or-edge-id"],
      "locator": "precise source location",
      "excerpt": "short original fragment",
      "speaker": "optional speaker",
      "context": "optional necessary context",
      "supports": "narrow supported statement"
    }

`id`, non-empty `targetIds`, `locator`, and `supports` are required. Exactly one of `excerpt` or `observation` is required; `speaker` and `context` are optional in the data shape but required by content when attribution or conditions matter. Every `targetIds` entry must resolve to an existing node or edge.

For the open node or edge, flatten the global evidence anchors and keep only anchors whose `targetIds` contain the current target ID. The renderer may use the target's existing `evidenceIds` to narrow source records, but `targetIds` is the authority for fragment-level projection. Never fall back to showing unrelated anchors from the same source when an anchored target has no match; report a validation defect or show an explicit no-anchored-evidence state.

Render the fragment together with its source label, precise locator, speaker when present, context when present, and `supports`. Treat all values as untrusted text. Old documents without anchored mode or without anchors retain the legacy source-card path.

## 4. Graph rendering

- Use WebGL for the graph when available; Canvas is acceptable for overlays, groups, minimap, and fallback.
- Keep labels legible through priority, collision, zoom thresholds, and viewport clipping rules.
- Always keep selected and directly related labels visible.
- Do not draw every label at overview scale.
- Hover may reveal more context, but no essential text may exist only on hover.
- Touch and keyboard users need the same information path.
- Provide a textual directory when WebGL is unavailable.

Avoid redrawing expensive graph buffers for drawer-only changes. Pointer hit testing, label layout, and minimap updates should run only when the relevant state changes.

## 5. Entry and drawer stack

The default entry is the character brief when present, otherwise the core path, otherwise an empty-node prompt.

Desktop drawers stack horizontally. Compact drawers stack vertically. A new layer covers the current one but leaves a stable, clickable rail of the previous layer. The rail must show enough label text to prevent the reader from losing their path.

Returning to an earlier rail truncates every layer after it. Search results, map nodes, and guide steps all enter this same stack; do not create competing histories.

## 6. Readability requirements

Measure computed styles in a real browser:

- important body text: at least 14 CSS px;
- metadata, evidence badges, and secondary labels: at least 12 CSS px;
- body line height: at least 1.45;
- interactive targets: at least 40 by 40 CSS px where layout permits;
- visible focus style for every keyboard-reachable control.

Test desktop, 390 by 844 compact layout, and browser zoom at 200 percent. Text may reflow or require vertical scrolling; it may not be clipped, overlapped, reduced below the size floor, or hidden behind the graph.

The first viewport is an orientation budget, not a mandate to fit the entire character brief. Keep essential entry content readable and allow the rest to scroll.

## 7. Interaction requirements

- Search, view switching, node selection, zoom, fit, drawer return, and evidence navigation are keyboard reachable.
- Escape closes or steps back predictably.
- Selected state is not communicated by color alone.
- Reduced-motion preferences are respected.
- Search and selection retain visible text even when graph labels are suppressed.
- The minimap is supportive navigation, never the only route to content.

## 8. Single-file build

The default user-facing output is exactly one HTML file. It contains:

- inline CSS;
- inline JavaScript;
- escaped embedded JSON data;
- embedded required images;
- no module script;
- no external script or stylesheet;
- no initial fetch;
- no embedded data capable of terminating its script element.

Anchors are part of the escaped embedded canvas JSON. They must not require a neighboring evidence file or an initial network request.

Source pages may open externally only after user action. Initial network activity contains the HTML document only.

Use official or in-work visuals for canonical reference. Embed required local assets as data URLs and retain their click-through source page and attribution.

The HTML must not depend on neighboring canvas JSON, claim-ledger JSON, verification JSON, image, font, screenshot, or log files. If retaining the full ledger or verification record inside the artifact is useful, embed it as inert, escaped JSON; never require it as a separate runtime file.

## 9. Build behavior

The builder must fail clearly on invalid references, unsafe URLs, missing required assets, and unescaped embedded data. It must not silently omit a broken image or unknown guide target.

Build tools may read canvas, ledger, verification, and asset files from a task-owned internal work directory. They must write only the requested HTML into the user-facing destination unless the user explicitly requests an audit package.

The output is one locally openable HTML file that still works after the internal work directory is removed. A screenshot, static mockup, network-dependent demo, or folder of required sidecars is not a completed artifact.
