# Content Contract

The explorer is character-first. A reader should meet a person before encountering chronology, lore, systems, or analytical vocabulary.

## Layer 1: Character brief

The default drawer must teach the character in roughly 30 to 60 seconds. The first viewport and the complete drawer are different budgets.

The first viewport guarantees only:

1. exact name and source boundary;
2. one-sentence character thesis;
3. two or three concrete introductory sentences;
4. the first-impression to later-understanding contrast;
5. a clear action into the core path.

The rest of the drawer may continue below the fold:

- identity coordinates;
- three to five behavior-based traits;
- key relationships;
- visual identity and canonical references;
- evidence scope and spoiler note.

Never compress the entire brief into one screen by shrinking important text. The first viewport must orient; the scrollable drawer may complete the explanation.

## Character thesis and introduction

The thesis identifies the person, their central tension, and the direction of meaningful change without pretending an interpretation is canon.

The introduction uses concrete social terms: role, position, constraint, repeated method, and consequence. For Chinese output, follow chinese-narrative-contract.md: situation and action first, interpretation second.

Avoid a list of biography facts. Avoid opening with an abstract label such as archetype, agency, thematic function, or core arc before the reader knows what the character does.

## First impression and reframing

First impression records what a new audience can reasonably notice from early presentation or canonical visual design. Reframing explains what later actions complicate, reverse, or deepen.

The two sides require distinct evidence. Reframing is not permission to call the first impression false; it explains where it was incomplete.

## Traits and relationships

Each trait needs a behavior, choice, recurring action, or creator statement. Prefer:

> Under pressure, the character does X, accepts Y cost, and repeats this pattern when Z returns.

Avoid:

> The character is strong, complex, and charismatic.

Write relationships as mutual effects and contested choices, not labels. State what each person wants, what they do to the other, what changes, and what remains unresolved. Use family, rival, mirror, mentor, or rescuer only after the concrete relationship is clear.

## Layer 2: Core path

Use five to nine ordered steps. Each step contains:

- what situation changed;
- which pressure or relationship entered;
- what the character chose;
- what became different afterward;
- the target view and evidence node.

The path explains how the person changes; it does not recap every plot beat. It may compress events, but it may not remove attribution, conditions, conflicts, or version boundaries.

Do not state a cause unless the ledger causalBasis is explicit. For inferred links, make the interpretation visible in the wording and evidence label.

## Layer 3: Evidence views

Choose the smallest set of views that answers the material's distinct questions. One view is valid. Five views are also valid when each answers a different necessary question. Never target a map count.

Relationships are commonly useful, but not mechanically mandatory. Candidate questions include:

- Which relationships alter what the character can choose?
- In what order does the character's understanding change?
- Which institution or faction constrains the character?
- Which rule, ability, or world mechanism shapes their decisions?
- Which recurring object, gesture, or phrase changes meaning?
- How do adaptations disagree?
- Where does public performance diverge from private behavior?

Every view needs a ledger view charter with question, inScope, outOfScope, and whyThisViewExists. If two views answer the same question, merge them. If a node does not help answer the declared question, remove it from that view.

## Layer 4: Node and edge detail

Each node contains:

- concise title;
- summary;
- optional body for nuance;
- reader-facing evidence label;
- one-hop relations;
- evidence links and source type.

Each claim-bearing node or edge target must map to atomic claims in the ledger.

Do not place what happened and what it means in one summary under a single factual label. Split them between summary and body, split the node, or label the whole statement as interpretation. A short edge label may compress wording, but it must not become stronger than the detail behind it.

For anchored evidence, the current node or edge receives only global anchors whose `targetIds` contain its ID. Do not show every fragment attached to the same source. An evidence card keeps the short `excerpt` or observable `observation`, precise `locator`, named `speaker` when applicable, necessary `context`, and narrow `supports` statement together. Preserve character self-report, reported speech, and conditions as attribution rather than rewriting them as narrator fact. `supports` and the surrounding prose must never claim more than the fragment establishes.

## Layer 5: Visual impression

Use canonical visual references before reinterpretation imagery. Explain what a viewer can actually see: silhouette, palette, garment, prop, posture, repeated framing, and version or costume.

Visual impression supports recognition. It does not prove personality or motive without separate textual evidence. Credit the creator or rights holder when known and expose the source page.

## Drawer navigation

The drawer stack grows outward:

    角色速览 -> 核心路径 -> 证据节点 -> 关系节点

New layers cover old layers while leaving a clickable rail. Returning to an earlier layer truncates the trail; it does not create a second navigation history. The current layer must remain visually dominant, and exposed rails must keep enough text to explain where they return.

## Medium neutrality

Use work, source scope, installment, and version in generic data. Put route, episode, chapter, season, volume, cut, ending, performance, or event inside source-scope records.

Do not require game-only concepts. A subject may come from animation, manga, novel, film, theatre, audio drama, mythology, or mixed adaptation material.
