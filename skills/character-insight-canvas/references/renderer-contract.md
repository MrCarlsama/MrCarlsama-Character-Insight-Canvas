# Renderer Contract

The renderer is a generic read-only explorer. Character facts belong in data, never in rendering code.

## Discovery

Search the current workspace for an existing renderer before creating one. A compatible renderer normally has:

- a data validator;
- a generic HTML template;
- Canvas/WebGL graph rendering;
- a build command accepting input data and output HTML;
- automated tests for model references and offline bundling.

Do not hardcode a home directory. Resolve paths from the active workspace, skill directory, or explicit user input.

## Required document capabilities

- metadata and subject;
- evidence records with safe HTTP(S) links;
- nodes, edges, groups, views, placements, and camera state;
- optional character brief;
- optional core guide;
- generic source scopes and certainty values;
- optional local visual assets that the build embeds as data URLs.

Optional fields must remain optional. Old documents without a character brief or guide must still open.

## Rendering requirements

- Use WebGL for the graph when available; Canvas is acceptable for overlays, groups, minimap, and fallback layers.
- Keep labels legible through priority and collision rules. Do not render every label at overview scale.
- The default entry is the character brief when present, otherwise the core path, otherwise an empty node prompt.
- Desktop drawers stack horizontally; compact drawers stack vertically.
- Respect reduced-motion preferences.
- Provide a textual fallback when WebGL is unavailable.
- Search, zoom, fit, view switching, node selection, and evidence navigation remain keyboard reachable.

## Single-file build requirements

The final artifact must contain:

- inline CSS;
- inline JavaScript;
- embedded JSON data;
- embedded required images;
- no module script;
- no external script or stylesheet;
- no initial `fetch()`;
- escaped embedded data that cannot terminate its script element.

Source links may open externally only after user action.

## Data-design rule

When one subject needs a new concept, first ask whether it is reusable:

- reusable concept → extend the generic schema and add validation/tests;
- subject fact → add data;
- one-off visual treatment → reject it unless it can be expressed as generic data.

Avoid renderer branches containing character names, work titles, routes, episode names, or private paths.
