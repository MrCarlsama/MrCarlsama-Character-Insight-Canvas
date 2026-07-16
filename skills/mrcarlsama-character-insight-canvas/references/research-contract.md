# Research Contract

The claim ledger is the research truth. Prose, graph nodes, guide steps, and the final HTML are projections of it. They may shorten a claim, but they may not strengthen it.

## 1. Fix the source boundary first

Record one explicit scope before research:

- character and work;
- medium and adaptation;
- edition, route, season, chapter, cut, or event boundary;
- spoiler ceiling;
- output language;
- research mode: public, supplied, or mixed.

Treat different adaptations, localizations, timelines, costumes, and retellings as separate source scopes. A claim spanning scopes must name every scope it uses.

## 2. Source ladder and source independence

Prefer the highest available source for each claim:

1. The work itself: scene, episode, chapter, route, official script, or supplied primary material.
2. Official production material: publisher or studio pages, guidebooks, creator commentary, formal interviews, and production notes.
3. Reliable reconstruction: licensed databases, detailed scene records, and reputable reference works.
4. Secondary interpretation: criticism, fan wikis, essays, and discussion archives.
5. Reinterpretation imagery: fan art, cosplay, edits, and mood boards.

Source tier is not truth probability. A character's line in the work proves that the character said it; it does not automatically prove the line's content is objectively true.

Use originGroup to record common origin. Two Wiki pages transcribing the same game file are one origin, not two independent confirmations. Repetition, search-result count, popularity, and reposts never create independence.

## 3. Keep four dimensions separate

Each atomic claim has exactly one claimType:

- fact: directly observable in the scoped work or official profile;
- official-commentary: a creator or official supplement explains the character;
- secondary-reconstruction: a scene, order, or detail reconstructed from secondary records;
- interpretation: the report explains meaning, motive, tension, or structure;
- visual-observation: a visible design feature is described without unsupported symbolism;
- unverified: scaffold-only state; forbidden in a completed case.

Each claim also has exactly one evidenceClass:

- confirmed-text;
- official-supplement;
- cross-checked-secondary;
- single-secondary;
- interpretation;
- visual-observation;
- unverified.

These fields answer different questions:

| Field | Question |
| --- | --- |
| sourceTier | Where did the material come from? |
| claimType | What kind of statement is this? |
| evidenceClass | What evidentiary basis supports this statement? |
| qualifiers | What attribution, condition, or dispute must remain visible? |
| causalBasis | Did the source establish causality? |

The canvas certainty field is only a reader-facing evidence label retained for renderer compatibility. It is not a probability and cannot replace the ledger fields.

Completed claims use these compatible pairs:

| claimType | Allowed evidenceClass |
| --- | --- |
| fact | confirmed-text, official-supplement |
| official-commentary | official-supplement |
| secondary-reconstruction | cross-checked-secondary, single-secondary |
| interpretation | interpretation |
| visual-observation | visual-observation |

When a sentence needs two rows, split it. Do not select the stronger row for convenience.

## 4. Atomic claim rule

One claim carries one primary assertion. Split these when they occur together:

- event and interpretation;
- a character's account and the report's judgment of that account;
- sequence and causality;
- visible design and symbolic meaning;
- facts from different versions.

If a sentence cannot be split without losing its meaning, classify the whole claim at the least assertive applicable level. Never give an interpretive sentence a factual label because one clause contains a fact.

Absolute or exhaustive language such as always, never, only, completely, nothing, or inevitably needs coverage broad enough to support it. A few examples support a repeated tendency, not a universal rule.

## 5. Required ledger shape

The ledger uses this top-level structure:

    {
      "schemaVersion": "1.0",
      "caseId": "work-character",
      "scope": {},
      "sourceScopes": [],
      "evidence": [],
      "viewCharters": [],
      "visualReferences": [],
      "claims": []
    }

Each claim requires:

    {
      "id": "claim-example",
      "category": "identity",
      "statement": "An atomic statement.",
      "claimType": "fact",
      "evidenceClass": "confirmed-text",
      "qualifiers": [],
      "attribution": null,
      "condition": null,
      "causalBasis": "none",
      "sourceScopeIds": ["scope-main"],
      "evidenceIds": ["ev-scene"],
      "sceneOrObservableBasis": "Exact scene, record, or observable feature.",
      "displayTargets": ["nodes.n-subject.summary"],
      "conflicts": [],
      "notes": null
    }

Allowed qualifiers are attributed, conditional, and disputed:

- attributed requires attribution naming who made the statement;
- conditional requires a condition that remains visible in displayed prose;
- disputed requires conflict records identifying the competing claim or source;
- causalBasis is explicit only when the scoped material establishes the causal link, inferred when the report proposes it, and none when no causal assertion is made.

Use stable display target paths:

- characterBrief.headline
- characterBrief.introduction
- characterBrief.firstImpression.surface
- characterBrief.firstImpression.reframed
- characterBrief.sections.SECTION_ID.ITEM_ID
- characterBrief.visualIdentity.summary
- characterBrief.visualIdentity.traits
- guide.title
- guide.summary
- guide.steps.STEP_ID
- nodes.NODE_ID.title
- nodes.NODE_ID.summary
- nodes.NODE_ID.body
- edges.EDGE_ID.label
- edges.EDGE_ID.summary
- groups.GROUP_ID.title
- groups.GROUP_ID.summary

Every target containing a research assertion must be covered by one or more claims. Decorative labels and navigation copy do not need claim IDs.

Metadata, source notes, view descriptions, and visual-reference notes are reserved for scope, navigation, or provenance. If they begin asserting something about the character, move that wording into one of the claim-bearing targets above instead of hiding it outside verification coverage.

## 6. Evidence and provenance records

Each ledger evidence record needs:

- id and title;
- urlOrLocation;
- sourceTier and sourceClass;
- originGroup;
- sourceScopeIds;
- the exact scene, chapter, record, page, timestamp, or observable basis when available;
- access date for public web material.

Do not invent a quote, URL, episode number, chapter number, timestamp, or scene order. Quotes are optional and should be short; paraphrase by default.

Evidence records are global source records. New canvas documents set `metadata.evidenceMode` to `anchored` and project the exact supporting fragments through `evidence[].anchors[]` instead of copying source snippets into individual nodes or edges:

    {
      "id": "anchor-scene-choice",
      "targetIds": ["n-choice", "e-choice-consequence"],
      "locator": "Episode 4, 12:14-12:22",
      "excerpt": "A short piece of the original wording.",
      "speaker": "Character name",
      "context": "The condition or exchange needed to read the line correctly.",
      "supports": "The narrow claim this fragment directly supports."
    }

Every anchor follows these rules:

- `id` is stable and unique within the document.
- `targetIds` is a non-empty array of canvas node or edge IDs. One anchor may support several targets, but every listed target must genuinely use that fragment.
- `locator` identifies the fragment precisely within the source: route and scene, episode and timestamp, chapter and page or panel, film timestamp, act and scene, dialogue ID, or supplied-file line range. A source title or whole chapter alone is not precise enough when a narrower locator is available.
- Exactly one of `excerpt` or `observation` is present. `excerpt` is a short original-language or supplied-text fragment. `observation` is a concise account of something directly visible or audible and is appropriate for animation, manga, film, theatre recordings, and other audiovisual or sequential-art material.
- `speaker` is present whenever words are spoken, written, self-reported, or relayed by an identifiable character. Omit it only when it truly does not apply.
- `context` is present whenever a condition, addressee, unreliable account, quoted report, scene setup, or version boundary changes how the fragment should be understood.
- `supports` says only what this fragment establishes. It must not be stronger, broader, more causal, or more objective than the material.

A character's self-description supports that the character said or believed something, not that the content is objectively true. Reported speech supports the report unless separately corroborated. Preserve conditions in both `context` and any displayed wording they qualify. Keep excerpts and observations short; do not copy long passages, transcripts, pages, or scene summaries into the canvas.

## 7. View charters

Every evidence view needs a charter:

    {
      "viewId": "relationships",
      "question": "Which relationships change what the character can choose?",
      "inScope": ["Actions and consequences involving the subject"],
      "outOfScope": ["Unrelated faction history"],
      "whyThisViewExists": "The relationship question cannot be answered by chronology alone."
    }

A view is not a theme bucket. If a node or edge cannot help answer the view's question, remove it or move it to the view that owns that question.

## 8. Visual provenance

Canonical visual references require:

- id and label;
- work and sourceScopeIds;
- assetKind;
- canonicalStatus;
- versionOrCostume;
- creatorCredit when known;
- publisherOrStudio;
- sourcePage or supplied location;
- localPath when the build embeds a local copy;
- transformation: original, crop, or edited;
- checksum when a local file is embedded.

Prefer official character sheets, publisher or studio pages, in-work frames, licensed art, and supplied primary images. Tier 5 imagery belongs only in a clearly marked reinterpretation layer.

Describe shape, palette, silhouette, garment, prop, posture, and recurring framing before proposing symbolic meaning. A color is not a personality trait without work-level or creator evidence.

## 9. Conflict and inference rules

- Preserve source conflict; do not average it into false certainty.
- Do not infer motive from outcome alone.
- Do not turn time order into causality.
- Do not turn a character's self-description into objective narration.
- Do not remove conditions or attribution during Chinese rewriting.
- Mark a core category unavailable when evidence is genuinely absent; never fill it with confident generalities.
