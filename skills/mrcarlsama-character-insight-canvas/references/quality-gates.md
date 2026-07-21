# Quality Gates

Apply every applicable gate before claiming completion. A failed independent-verification gate blocks a final artifact even when the HTML works perfectly.

## 1. Scope and research

- [ ] Exact character, work, medium, adaptation or version, and spoiler ceiling are visible.
- [ ] If the user did not specify a region and a distinct Mainland China release exists, Mainland China is the primary source scope.
- [ ] Every supplementary regional scope names its region, language, version, and material difference from the primary release.
- [ ] Later foreign-release content did not silently extend the primary chronology or spoiler ceiling.
- [ ] Website hosting region was not confused with the content edition reproduced by a mirror.
- [ ] Regional, adaptation, edition, broadcast, rerun, patch, and later-canon changes were actively checked.
- [ ] Every material change is classified as localization change, adaptation rewrite, script revision, retcon, or unresolved contradiction.
- [ ] `retcon` is used only when later canon demonstrably supersedes an earlier continuity claim.
- [ ] Unresolved contradictions preserve both versions and use disputed claims rather than forced reconciliation.
- [ ] The atomic claim ledger exists beside the canvas inside a task-owned internal work directory.
- [ ] Every display-bound claim has one claim type, one evidence class, source scopes, evidence, and observable basis.
- [ ] Attribution, conditions, disputes, and causal basis are recorded separately.
- [ ] First impression and later reframing use distinct evidence.
- [ ] Every personality adjective is backed by an action, choice, repeated behavior, or creator statement.
- [ ] Facts, official commentary, secondary reconstruction, interpretation, and visual observation remain distinct.
- [ ] Character speech is not presented as objective truth without separate support.
- [ ] Time order is not presented as causality without explicit basis.
- [ ] Conflicts and missing evidence remain visible.
- [ ] No duplicate URL is counted as an independent source when originGroup is shared.
- [ ] Every new canvas sets `metadata.evidenceMode` to `anchored`; legacy canvases may omit the field and anchors.
- [ ] Every claim-bearing node and edge in anchored mode resolves to at least one global evidence anchor whose `targetIds` contains that target ID.
- [ ] Every anchor has a unique ID, non-empty valid node or edge `targetIds`, a precise locator, exactly one of `excerpt` or `observation`, and a `supports` statement.
- [ ] Excerpts and observations are short fragments, not copied passages, transcripts, pages, or long scene summaries.
- [ ] Spoken, written, self-reported, or relayed words retain their speaker; material conditions and scene context remain visible.
- [ ] Each `supports` statement is no stronger, broader, more causal, or more objective than its anchor.

## 2. Independent verification

- [ ] A separate sub-agent performed the verification.
- [ ] The verifier started with isolated context or the closest available equivalent.
- [ ] The verifier independently searched public sources or reread supplied primary material.
- [ ] For region-aware work, the verifier independently checked the primary region and every claimed regional difference.
- [ ] The verifier checked both sides of every continuity relation and confirmed its visible label.
- [ ] Every displayed claim has a verdict.
- [ ] No displayed claim remains insufficient, contradicted, or scope-conflict.
- [ ] Every partially-confirmed claim includes the required correction and qualifiers.
- [ ] The producer did not silently overwrite a verifier verdict.
- [ ] Final canvas and HTML wording received a second projection review.
- [ ] Every claim-bearing display target was reviewed.
- [ ] No open P0 or P1 projection-drift finding remains.

If an independent sub-agent is unavailable, stop at an explicitly labeled internal draft.

## 3. Chinese narrative

For Simplified Chinese output:

- [ ] The entry introduces the person's situation and actions before abstract interpretation.
- [ ] Traits are written through behavior and consequence, not adjective stacks.
- [ ] Relationships explain what people do to each other and what changes.
- [ ] Core-path steps say what happened, what was chosen, and what became different.
- [ ] Conditions and attribution appear in the displayed sentence, not only in source metadata.
- [ ] Analytical terms are explained in concrete Chinese on first use.
- [ ] Repeated translated formulas and abstract-noun chains were rewritten.
- [ ] The prose reads naturally aloud without turning into chopped telegraph sentences.
- [ ] Naturalization did not strengthen certainty, causality, universality, or moral judgment.

## 4. Information architecture

- [ ] The character brief is the default entry when available.
- [ ] The first viewport contains name and scope, thesis, concrete introduction, first-impression reframing, and core-path action.
- [ ] A new reader can understand who the character is without opening a map.
- [ ] Material version changes appear visibly in the character brief and are not hidden in metadata or evidence drawers.
- [ ] The full brief may scroll; it was not forced into one viewport by shrinking type.
- [ ] The core path contains five to nine meaningful changes rather than a plot recap.
- [ ] Every guide step opens a node inside its declared view.
- [ ] Every claim-bearing brief, guide, node, and edge target maps to ledger claims.
- [ ] Every evidence view has a question, inclusion boundary, exclusion boundary, and reason to exist.
- [ ] Every node and edge in a view helps answer that view's question.
- [ ] Two views answering the same question were merged.
- [ ] Opening a node or edge shows only anchors whose `targetIds` contain the current target ID.
- [ ] Drawer return truncates to the selected layer and exposed rails remain understandable.

## 5. Visual provenance

- [ ] Canonical references come from official, licensed, in-work, or supplied primary material.
- [ ] Every canonical visual records work, source scope, asset kind, canonical status, version or costume, rights holder or studio, source page, and transformation.
- [ ] Creator credit is recorded when known.
- [ ] Embedded local assets have a checksum.
- [ ] Fan art, cosplay, edits, and mood boards are clearly marked as reinterpretation.
- [ ] Visible design observations are separated from symbolic interpretation.

## 6. Automated technical checks

- [ ] audit-case.mjs exits with zero errors.
- [ ] Canvas data validation has zero errors.
- [ ] Type checks and unit tests pass where the renderer provides them.
- [ ] The build emits exactly one usable user-facing HTML artifact.
- [ ] No external script, stylesheet, module import, or initial fetch remains.
- [ ] Required visuals are embedded.
- [ ] Anchored evidence is embedded in the HTML's escaped canvas data and needs no sidecar or initial fetch.
- [ ] Legacy documents without `evidenceMode` or `anchors` still use the legacy evidence path.
- [ ] The HTML still works when the internal canvas, ledger, verification, asset, screenshot, and log files are unavailable.
- [ ] Output size stays within the renderer's declared budget.
- [ ] No character name or work title appears in generic renderer or build source.
- [ ] No RESEARCH REQUIRED, TODO, TBD, FIXME, unverified value, or pending verdict remains.

## 7. Delivery boundary

- [ ] The normal handoff links exactly one file: the final HTML.
- [ ] No case-specific JSON, image, font, screenshot, audit report, or log is required beside that HTML.
- [ ] Internal work files are preserved only when the user explicitly requests an audit or development package.
- [ ] Cleanup touches only the task-owned temporary work directory, never supplied materials, existing user files, or shared renderer assets.

## 8. Browser acceptance

Test a desktop viewport, 390 by 844 compact viewport, and 200 percent browser zoom in a real browser.

- [ ] Character brief reflows without horizontal clipping.
- [ ] When continuity notes exist, their type, compared scopes, status, summary, and source action are visible on desktop and compact layouts.
- [ ] Important body text computes to at least 14 CSS px.
- [ ] Metadata, badges, and secondary labels compute to at least 12 CSS px.
- [ ] Body line height computes to at least 1.45.
- [ ] Core path opens above the brief and leaves a usable rail.
- [ ] A guide step opens a third node layer.
- [ ] Returning to an exposed rail removes later layers correctly.
- [ ] View switcher, search, selected labels, zoom, and fit work.
- [ ] Evidence drawers for two different targets do not leak anchors targeted only at the other target.
- [ ] Essential information does not depend on hover.
- [ ] Keyboard focus and reduced-motion behavior work.
- [ ] Compact entry opens predictably and can be dismissed.
- [ ] Console errors: zero.
- [ ] Initial network requests: the HTML document only.
- [ ] WebGL failure produces a readable directory.

## 9. Human semantic audit

The independent verifier or a human reviewer must answer:

- Does each source actually support the displayed wording?
- Did “the character did not receive the expected answer” become “the character got nothing”?
- Did chronology become causality?
- Did a character's claim become the narrator's fact?
- Does each anchor identify the exact fragment, speaker, necessary context, and only what that fragment supports?
- Does any `supports` statement overclaim beyond a self-report, relayed account, conditional statement, or observable action?
- Did clarity erase contradiction or version difference?
- Was an ordinary translation, adaptation choice, or unexplained inconsistency mislabeled as “吃书”?
- Did the report add redemption, inevitability, uniqueness, or total transformation without evidence?
- Does each map answer a real question, or has it become a themed storage box?
- Does the first drawer give a memorable person rather than a pile of lore?

## 10. Automation boundary

| Problem | Automatic gate | Human or verifier judgment |
| --- | --- | --- |
| IDs, references, required fields | hard failure | not normally needed |
| Anchor shape, XOR fragment field, and target IDs | hard failure | whether the fragment supports the target |
| Missing condition or attribution | hard failure | whether wording preserves it |
| Blocking verdict | hard failure | factual review that produced verdict |
| Absolute or causal wording | warning | whether evidence supports it |
| Fact and interpretation mixed | warning at best | required |
| View overlap | similarity warning | whether questions are distinct |
| Typography and clipping | browser measurement | reading and scanning quality |
| Visual provenance fields | hard failure | whether the reference is representative |
| Source entails claim | cannot be automated reliably | required |

Do not pretend a keyword list can verify story truth. Mechanical defects fail automatically; semantic truth requires independent reading.

## 11. Medium-neutral stress test

Before publishing the Skill itself, test its rules mentally or with fixtures against:

1. an animation character with episode evidence and no routes;
2. a game character with branching routes and official supplements;
3. a character whose manga and animation adaptations conflict;
4. a supplied-only character dossier with no public canon page.

If the schema forces one medium's vocabulary onto all four, the Skill is not general.
