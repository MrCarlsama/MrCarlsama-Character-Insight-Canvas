# Quality Gates

Apply every gate before claiming completion.

## Research

- [ ] Exact character, work, version/adaptation, and spoiler scope are visible.
- [ ] First impression and later reframing use different evidence.
- [ ] Every personality adjective is backed by an action, choice, repeated behavior, or creator statement.
- [ ] Facts, official commentary, secondary reconstruction, interpretation, and visual observation are labeled separately.
- [ ] Conflicts and missing evidence remain visible.
- [ ] Visual references have attribution and source links.
- [ ] Fan art or cosplay is not presented as canonical evidence.

## Information architecture

- [ ] The character brief is the default entry when available.
- [ ] A new reader can understand the character without opening the maps.
- [ ] The core path contains 5–9 meaningful changes rather than plot recap.
- [ ] Each evidence view answers a distinct question.
- [ ] Every guide step opens a node inside its declared view.
- [ ] Every brief claim with a node target opens real evidence.
- [ ] Drawer return behavior truncates to the chosen layer.

## Technical

- [ ] Data validation has zero errors.
- [ ] Type checks and unit tests pass where the renderer provides them.
- [ ] The build emits exactly one usable HTML artifact.
- [ ] No external script, stylesheet, module import, or initial fetch remains.
- [ ] Required visuals are embedded.
- [ ] Output size stays within the renderer's declared budget.
- [ ] No subject name or work title appears in generic renderer/build source.
- [ ] No placeholder such as `RESEARCH REQUIRED`, `TODO`, `TBD`, or `FIXME` remains.

## Browser

Test one desktop viewport and one compact viewport.

- [ ] Character brief is readable without horizontal clipping.
- [ ] Core path opens above the brief and leaves its rail exposed.
- [ ] A guide step opens a third node layer.
- [ ] View switcher, search, labels, zoom, and fit work.
- [ ] Mobile entry opens predictably and can be dismissed.
- [ ] Console errors: zero.
- [ ] Initial network requests: the HTML document only.
- [ ] WebGL failure produces a readable directory.

## Content audit prompts

Run the design mentally against at least these three cases:

1. An animation character with episode-based evidence and no game routes.
2. A game character with branching routes and official supplemental writing.
3. A character whose manga and animation adaptations disagree.

If the schema or instructions require one medium's vocabulary for all three, the skill is not general yet.
