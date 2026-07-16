---
name: mrcarlsama-character-insight-canvas
description: Use when the user wants an evidence-backed fictional-character study rendered as a read-only single-file HTML exploration canvas, across games, animation, manga, novels, film, theatre, audio drama, or mixed adaptations.
---

# MrCarlsama Character Insight Canvas

Build a character-first explorer, not a lore dump. The reader meets a person first, follows the character's changes second, and opens evidence only when they want to verify or go deeper.

The build uses four internal artifacts before the HTML:

```text
scope -> claim ledger -> independent verification -> canvas projection -> HTML
```

The claim ledger is the research truth. The canvas is only a readable projection of verified claims. Never let polished prose silently upgrade attribution, conditions, uncertainty, causality, or source scope.

These are working artifacts, not four user deliverables. By default, keep the scope card, ledger, verification report, canvas JSON, downloaded images, screenshots, and logs inside a task-owned temporary work directory. The normal handoff is exactly one self-contained HTML file. Preserve or expose raw work artifacts only when the user explicitly asks for an audit or development package.

## 1. Lock the scope

Create a scope card containing:

- exact character and source work;
- medium, adaptation, edition, route, season, chapter, or cut boundary;
- spoiler ceiling;
- output language;
- research mode: `public`, `supplied`, or `mixed`;
- supplied materials and missing sources;
- one task-owned temporary work directory for the claim ledger, verification report, canvas data, and downloaded assets;
- one final HTML path outside that work directory.

Proceed without asking when these are inferable. Ask one blocking question only when identity, adaptation, or spoiler scope would materially change the result.

Completion criterion: one exact subject and one explicit source boundary are fixed; similarly named characters, adaptations, localizations, and timelines cannot be mixed accidentally.

## 2. Build the atomic claim ledger

Read [research-contract.md](references/research-contract.md) before collecting claims. Browse for public-source work. For supplied-source work, inventory and independently read the supplied material before browsing only to fill gaps.

Persist the ledger beside the canvas inside the task-owned work directory; do not keep it only in conversation context and do not place it beside the final HTML by default. Each claim must be atomic: one primary claim type, one evidence class, one modality, and one causal status. Split fact from interpretation. Preserve who said something, under what condition, in which version, and whether two pages derive from the same original text.

Do not draft the character report while a core category is missing or a displayed claim is still `unverified`.

Completion criterion: every intended headline, brief item, guide step, node statement, and relationship statement maps to an atomic ledger claim with source scope, evidence, observable basis, display targets, and any required attribution or condition.

## 3. Run independent verification

Read [verification-contract.md](references/verification-contract.md). Spawn a separate verification sub-agent that did not inherit the producer's reasoning. When the platform supports context control, start it with no forked turns or equivalent isolated context.

Give the verifier only the scope card, claim ledger, supplied materials, and source locations. Do not give it the producer's conclusions or ask it to confirm a preferred reading. The verifier must independently search public sources or independently reread supplied primary material, then write the structured verification report without editing the ledger or canvas.

The producer must resolve `partially-confirmed`, `insufficient`, `contradicted`, and `scope-conflict` results explicitly. Do not silently overrule the verifier. If an independent sub-agent is unavailable, the run may produce an internal draft but must stop before claiming a verified or final artifact.

Completion criterion: every display-bound claim has a verifier verdict; no unresolved blocking verdict remains; conditional and attributed claims retain the verifier's required qualifiers.

## 4. Synthesize character-first content

Read [content-contract.md](references/content-contract.md). When the output is Simplified Chinese, also read and apply [chinese-narrative-contract.md](references/chinese-narrative-contract.md).

Produce:

- a natural one-sentence character thesis;
- `第一眼 -> 深入后`;
- three to five behavior-based traits;
- key relationships expressed through concrete tension and consequence;
- a five-to-nine-step core path;
- the smallest set of evidence views needed to answer distinct questions;
- a restrained visual section led by canonical references.

For Chinese output, use `先人后论`: establish the person's situation and actions before naming the interpretation. Prefer contextual, flowing Chinese over translated analytical formulas. A natural-language pass may change rhythm and wording, but it may not remove claim IDs, attribution, conditions, conflicts, or uncertainty.

Completion criterion: a new reader can answer “这个人是谁、哪里鲜明、为什么会这样、和谁形成关键牵扯、后来怎么变了” from the entry drawer, without mistaking the report's interpretation for canon.

## 5. Project verified claims into canvas data

When starting a case, run:

```bash
node <skill-dir>/scripts/scaffold.mjs \
  --character "<character>" \
  --work "<work>" \
  --output "<temporary-work-dir>/<case>.canvas.json"
```

The scaffold also creates `<case>.claims.json` and `<case>.verification.json` in that internal work directory. Replace every placeholder. Read [renderer-contract.md](references/renderer-contract.md) before changing a renderer or data shape.

Every claim-bearing canvas target must appear in the ledger's `displayTargets`. Each evidence view needs a charter: one question, explicit inclusion boundary, explicit exclusion boundary, and a reason to exist. Prefer generic data over subject-specific renderer branches.

New canvas documents use `metadata.evidenceMode: "anchored"`. Keep evidence records global, place precise supporting fragments in `evidence[].anchors[]`, and point each anchor at the node or edge IDs it supports through `targetIds`. A renderer must show a node or edge only the anchors whose `targetIds` contain that target's ID; it must not dump every fragment from the same source into every evidence drawer.

Completion criterion: all references resolve; no placeholder or `unverified` value remains; every claim-bearing display target maps to one or more verified atomic claims; view charters match what the maps actually contain.

## 6. Verify the final projection

Return the finished canvas data and rendered HTML to the independent verifier. The verifier compares actual displayed wording against the ledger and its earlier verdicts, looking for projection drift:

- `可能` became `必然`;
- a character statement became objective truth;
- sequence became causality;
- an interpretation received a factual badge;
- a version boundary disappeared;
- Chinese rewriting removed necessary qualification.

The verifier updates only the verification report. The producer fixes the data and requests one recheck. Do not create an endless vote among agents; unresolved source conflict stays visible.

Completion criterion: projection review passes, all claim-bearing targets were reviewed, and no P0/P1 drift finding remains.

## 7. Build and run quality gates

Reuse a compatible renderer when present. If none exists and the user requested HTML, implement the smallest renderer satisfying [renderer-contract.md](references/renderer-contract.md). Embed CSS, JavaScript, canvas data, anchored evidence metadata, and required images into one offline HTML file. The file must remain complete after the internal work directory is unavailable.

Run:

```bash
node <skill-dir>/scripts/audit-case.mjs \
  --input "<case.canvas.json>" \
  --ledger "<case.claims.json>" \
  --verification "<case.verification.json>"
```

Then apply every gate in [quality-gates.md](references/quality-gates.md). Test desktop, 390x844 compact layout, and 200% zoom with a real browser. Exercise entry, core path, view switching, node opening, drawer return, search, zoom, fit, source navigation, and WebGL fallback.

After every gate passes, copy or build only the final HTML into the requested destination. Remove only the task-owned temporary work directory, or leave an operating-system temporary directory for normal cleanup. Never delete supplied materials, pre-existing user files, or shared renderer assets.

Completion criterion: case audit, renderer validation, type checks, and tests pass; browser console has zero errors; initial network activity contains only the HTML; computed typography meets the contract; previous drawer layers remain visible and usable; the user-facing output set contains exactly one HTML file and requires no neighboring JSON, image, screenshot, or log file.

## 8. Hand off

Lead with and link only the HTML artifact, then report in prose:

- exact subject and source boundary;
- what the first drawer teaches;
- why each evidence view exists;
- verifier verdict summary and remaining non-blocking uncertainty;
- test and browser results;
- clickable HTML path.

Do not expose internal ledger, verification, canvas, asset, screenshot, or log paths in the normal handoff. If the user explicitly requests a reproducible audit package, preserve those files as an optional secondary package; that is a different delivery mode from the default HTML-only request.

Do not claim publication readiness, source completeness, canon certainty, or independent verification beyond what the report proves.

Completion criterion: the user receives one clickable HTML file, can open it without neighboring assets, understands its evidence boundary, and can distinguish verified text from attributed speech, reconstruction, visual observation, and interpretation without reading the work log.
