---
name: character-insight-canvas
description: Use when the user wants an evidence-backed fictional-character report rendered as a read-only single-file HTML exploration canvas, whether the source is a game, anime, manga, novel, film, or mixed adaptations.
---

# Character Insight Canvas

Build a character-first explorer, not a lore dump.

The reader must understand who the character is before entering chronology, relationships, systems, or interpretation. Every important claim must remain traceable to evidence, and uncertainty must stay visible.

## 1. Lock the scope

Create a private scope card containing:

- exact character and source work;
- medium, adaptation, edition, route, season, or chapter boundary;
- spoiler ceiling;
- output language;
- supplied materials and missing public sources;
- target data file and HTML path.

Proceed without asking when these are inferable. Ask one blocking question only when identity, adaptation, or spoiler scope would materially change the report.

Completion criterion: one exact subject and one explicit source boundary are fixed; similarly named characters and adaptations cannot be mixed accidentally.

## 2. Build the claim ledger

For public-source work, browse the web. For supplied-source work, inventory the supplied material first and browse only to fill material gaps or verify unstable facts.

Read [research-contract.md](references/research-contract.md) before collecting claims. Record identity, first impression, personality in action, contradictions, relationships, arc, signature motifs, and visual identity. Do not draft the report while the ledger is still missing a core category.

Completion criterion: every claim intended for the HTML has a claim type, certainty, source, source scope, and a scene or observable basis; every core category is covered or explicitly marked unavailable.

## 3. Synthesize character-first content

Read [content-contract.md](references/content-contract.md). Produce:

- a one-sentence character thesis;
- `第一眼 → 深入后`;
- 3–5 behavior-based traits;
- key relationships expressed as tensions, not labels;
- a 5–9 step core path;
- the smallest set of evidence views needed to answer the material's distinct questions;
- a restrained visual identity section using canonical references first.

Separate fact, official commentary, secondary reconstruction, interpretation, and visual observation. Preserve source conflicts instead of averaging them into false certainty.

Completion criterion: a new reader can answer “她/他是谁、有什么鲜明特点、为什么这样、和谁构成关键张力、经历了怎样的变化” from the entry drawer alone, while every deeper answer has a route to evidence.

## 4. Model the case

When starting a new case, run:

```bash
node <skill-dir>/scripts/scaffold.mjs \
  --character "<character>" \
  --work "<work>" \
  --output "<case.canvas.json>"
```

Replace every scaffold placeholder. Read [renderer-contract.md](references/renderer-contract.md) before changing the renderer or data schema. Prefer extending generic data over adding subject-specific branches to rendering code.

Completion criterion: IDs are unique; nodes, edges, groups, views, guide steps, evidence, scope IDs, and visual references all resolve; validation reports zero errors; no scaffold placeholder remains.

## 5. Build the single-file explorer

Reuse a compatible renderer when present. Preserve existing documents that omit newer optional fields. If no compatible renderer exists and the user requested an HTML artifact, implement the smallest renderer satisfying the renderer contract instead of returning mock markup.

Use official or in-work visuals for canonical reference. Embed required visual assets into the HTML; source pages may remain click-through links but must not be fetched during initial rendering.

Completion criterion: one HTML file opens locally, contains its CSS/JavaScript/data/required images, and makes no runtime request except user-initiated source navigation.

## 6. Run the quality gates

Read and apply every gate in [quality-gates.md](references/quality-gates.md). Test desktop and mobile with a real browser. Exercise entry, core path, view switching, node opening, drawer return, search, zoom, and fallback behavior.

Completion criterion: automated checks pass; browser console has zero errors; initial network activity contains only the HTML document; text remains readable; the drawer stack exposes its previous layers; factual and interpretive labels match the claim ledger.

## 7. Hand off

Lead with the artifact, then report:

- exact subject and source boundary;
- what the first drawer teaches;
- selected evidence views and why they exist;
- material uncertainties or unavailable evidence;
- test and browser verification results;
- clickable HTML path.

Do not claim publication readiness, source completeness, or canon certainty beyond what was actually checked.

Completion criterion: the user can open the artifact and knows its evidence boundary without reading the work log.
