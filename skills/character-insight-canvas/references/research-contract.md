# Research Contract

Use a claim ledger before prose. The ledger is the single source of truth for what may appear in the explorer.

## Source ladder

Prefer the highest available source for each claim; a lower tier may reconstruct a scene but cannot silently upgrade itself into canon.

1. The work itself: episode, chapter, route, scene transcript, official script, or supplied primary material.
2. Official production material: publisher/studio character pages, guidebooks, creator commentary, official interviews, production notes.
3. Reliable reconstruction: licensed databases, detailed scene records, reputable reference works.
4. Secondary interpretation: criticism, fan wikis, essays, discussion archives.
5. Reinterpretation imagery: fan art, cosplay, edits, mood boards.

Tier 5 is never canonical visual evidence. Keep it in an explicitly optional reinterpretation layer.

## Claim types

Assign exactly one primary type:

- `fact`: directly observable in the work or official profile.
- `official-commentary`: a creator or official supplement explains the character.
- `secondary-reconstruction`: a scene/order/detail is reconstructed from secondary records.
- `interpretation`: the report explains meaning, tension, motive, or structure.
- `visual-observation`: a visible design feature is described without assigning unsupported symbolism.

Map these to renderer certainty values:

| Claim type | Default certainty |
| --- | --- |
| fact | `confirmed-text` |
| official-commentary | `official-supplement` |
| secondary-reconstruction | `cross-checked-secondary` |
| interpretation | `interpretation` |
| visual-observation | `confirmed-text` when the reference is official; otherwise label its source class explicitly |

## Required ledger fields

Each displayed claim needs:

```text
claim_id
category
statement
claim_type
certainty
source_scope
source_url_or_supplied_location
scene_or_observable_basis
node_id
notes_or_conflict
```

## Core coverage

Cover every applicable category:

- identity and social position;
- first audience impression;
- later reframing;
- desire, fear, contradiction, and decision pattern;
- personality demonstrated through actions;
- key relationships and mutual effects;
- irreversible choices and arc;
- repeated object, gesture, phrase, ability, costume, or motif;
- official visual anchors;
- adaptation/version differences;
- unresolved conflicts and missing evidence.

## Conflict rules

- Do not merge different adaptations, localizations, routes, or timelines without a scope label.
- When sources disagree, preserve both claims and describe the conflict.
- Do not infer motive from outcome alone.
- Do not use popularity, fan consensus, or repeated reposting as confirmation.
- Do not invent a citation, quote, episode number, chapter number, or scene order.
- Quotes are optional; when used, keep them short and source-compliant. Paraphrase by default.

## Visual research rules

- Prefer official character sheets, studio/publisher pages, in-work frames, licensed art, or supplied primary images.
- Describe visible shape, palette, silhouette, garment, prop, posture, and repeated framing before interpreting them.
- Do not turn a color into personality symbolism without work-level or creator evidence.
- If no canonical visual is available, use text and palette tokens. Do not promote fan art into the canonical slot.
- Store attribution and source URL beside every visual reference.
