# Independent Verification Contract

Independent verification is a hard completion gate. It is not a producer self-review and not a request for another agent to agree with the draft.

## 1. Independence requirements

Use a separate sub-agent with isolated context. When the platform supports it, start the verifier with no forked conversation turns or the closest equivalent.

Give the verifier only:

- the scope card;
- the atomic claim ledger;
- supplied primary materials and their locations;
- source URLs or search leads.

Do not give it the producer's prose, preferred interpretation, or arguments for why a claim should pass during the first verification pass. The verifier must not edit the ledger, canvas, or HTML. It writes only the verification report.

For public or mixed research, the verifier performs its own web search and opens the sources it relies on. For supplied research, it independently reads the supplied primary material. Merely rereading the producer's notes does not count.

If the environment cannot run an independent sub-agent, the result is an internal draft. Do not label it verified, final, publication-ready, or independently checked.

## 2. Claim-level verdicts

The verifier assigns exactly one verdict to every display-bound claim:

- confirmed: the scoped evidence supports the statement as written;
- partially-confirmed: the core is supported, but named qualifiers or wording changes are required;
- interpretation-reasonable: the evidence basis exists and the interpretation stays within it;
- insufficient: available evidence does not support the displayed strength;
- contradicted: scoped evidence conflicts with the statement;
- scope-conflict: the statement mixes versions, adaptations, routes, or spoiler boundaries.

Independence is evaluated by originGroup, not URL count. Multiple pages deriving from one original record count as one origin.

The verifier must distinguish:

- evidence that a line was spoken from evidence that the line is true;
- repeated behavior from a universal personality rule;
- chronology from causality;
- official commentary from work-level fact;
- plausible interpretation from canon confirmation;
- visible design from symbolic reading.

## 3. Verification report shape

Use this top-level structure:

    {
      "schemaVersion": "1.0",
      "caseId": "work-character",
      "metadata": {},
      "claims": [],
      "projectionReview": {}
    }

Required metadata:

    {
      "status": "passed",
      "verifierRunId": "independent-run-id",
      "independentSubagent": true,
      "isolatedContext": true,
      "sourceReviewPerformed": true,
      "publicWebSearchPerformed": true,
      "verifiedAt": "ISO-8601 timestamp"
    }

publicWebSearchPerformed must be true for public and mixed research. For supplied-only research it may be false when the report names the independently reread supplied material.

Each claim result contains:

    {
      "claimId": "claim-example",
      "verdict": "confirmed",
      "checkedEvidenceIds": ["ev-scene"],
      "independentOriginGroups": ["game-script-main"],
      "requiredQualifiers": [],
      "notes": "Why this verdict follows from the checked material.",
      "suggestedCorrection": null
    }

For a final partially-confirmed result, requiredQualifiers must be non-empty and the ledger must already preserve them. If the problem only requires a wording or factual correction, the producer fixes it and asks for a recheck; the final verdict should then become confirmed or interpretation-reasonable. For insufficient, contradicted, or scope-conflict, the verifier must state the mismatch.

## 4. Producer resolution rules

The producer may:

- correct the statement;
- add the required attribution or condition;
- lower the claim type or evidence class;
- narrow the source scope;
- remove the claim from display;
- preserve a real conflict as disputed.

The producer may not silently change the verifier's verdict. After a material correction, ask the verifier to recheck that claim. If the conflict is genuinely unresolved, display the conflict instead of selecting the convenient answer.

A completed canvas cannot display claims with insufficient, contradicted, or scope-conflict verdicts. A partially-confirmed claim can pass only after every required qualifier appears in the ledger and final wording.

## 5. Final projection review

After the canvas and HTML exist, return both to the same verifier. This second pass checks whether research truth survived presentation.

Review every claim-bearing display target for:

- possible becoming certain;
- attributed speech becoming objective narration;
- sequence becoming causality;
- interpretation receiving a factual evidence label;
- adaptation or version boundaries disappearing;
- conflict being hidden;
- Chinese rewriting dropping conditions, attribution, or uncertainty;
- a short label becoming stronger than its detailed explanation.

Record:

    {
      "status": "passed",
      "verifierRunId": "same-independent-run-id",
      "reviewedTargets": ["characterBrief.headline"],
      "findings": [],
      "reviewedAt": "ISO-8601 timestamp"
    }

Finding severities:

- P0: fabricated source, wrong identity, or dangerous scope mix;
- P1: material factual drift, missing condition, false causality, or interpretation presented as fact;
- P2: wording, navigation, or readability issue that does not change the claim.

No P0 or P1 finding may remain open. One focused recheck is preferable to an endless committee of agents.

projectionReview.verifierRunId must equal metadata.verifierRunId. A second producer self-check cannot impersonate the independent projection pass.

## 6. What automation can and cannot prove

Automation may hard-fail missing IDs, missing qualifiers, unresolved verdicts, stale placeholders, and incomplete projection coverage. It may warn about absolute words, causal verbs, and translated analytical phrases.

Automation cannot decide whether a source truly entails a nuanced character claim. That judgment stays with the independent verifier. Do not dress a regular expression up as factual verification.
