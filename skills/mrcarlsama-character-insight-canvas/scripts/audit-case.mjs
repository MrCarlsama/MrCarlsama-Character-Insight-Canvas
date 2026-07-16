#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CLAIM_TYPES = new Set([
  "fact",
  "official-commentary",
  "secondary-reconstruction",
  "interpretation",
  "visual-observation",
  "unverified",
]);
const EVIDENCE_CLASSES = new Set([
  "confirmed-text",
  "official-supplement",
  "cross-checked-secondary",
  "single-secondary",
  "interpretation",
  "visual-observation",
  "unverified",
]);
const QUALIFIERS = new Set(["attributed", "conditional", "disputed"]);
const CAUSAL_BASES = new Set(["explicit", "inferred", "none"]);
const VERDICTS = new Set([
  "confirmed",
  "partially-confirmed",
  "interpretation-reasonable",
  "insufficient",
  "contradicted",
  "scope-conflict",
]);
const BLOCKING_VERDICTS = new Set(["insufficient", "contradicted", "scope-conflict"]);
const COMPLETE_VERIFICATION_STATUSES = new Set(["complete", "completed", "passed", "verified"]);
const CLOSED_FINDING_STATUSES = new Set(["resolved", "closed"]);
const CLAIM_EVIDENCE_COMPATIBILITY = new Map([
  ["fact", new Set(["confirmed-text", "official-supplement"])],
  ["official-commentary", new Set(["official-supplement"])],
  ["secondary-reconstruction", new Set(["cross-checked-secondary", "single-secondary"])],
  ["interpretation", new Set(["interpretation"])],
  ["visual-observation", new Set(["visual-observation"])],
]);
const PLACEHOLDER_RE = /\b(?:RESEARCH REQUIRED|TODO|TBD|FIXME)\b/i;
const STRONG_TERMS = ["必定", "上限", "一无所获", "迫使", "彻底", "证明", "唯一", "完全", "决定了", "导致", "瓦解"];
const TRANSLATIONESE = [
  ["这意味着", /这意味着/],
  ["这表明", /这表明/],
  ["换言之", /换言之/],
  ["扮演着……角色", /扮演着[^。；，]{0,24}角色/],
  ["不仅仅是……更是", /不仅仅是[^。；]{0,50}更是/],
  ["这不是……而是", /这不是[^。；]{0,50}而是/],
  ["核心弧线", /核心弧线/],
  ["主体性", /主体性/],
  ["方向绑定", /方向绑定/],
  ["问题前提", /问题前提/],
];

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function hasValue(value) {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0 && value.every((item) => hasValue(item));
  return value !== null && value !== undefined;
}

function issue(code, message, location) {
  return location ? { code, message, location } : { code, message };
}

function pushRequired(errors, object, field, location) {
  if (!record(object) || !hasValue(object[field])) {
    errors.push(issue("REQUIRED_FIELD", `${location}.${field} is required.`, `${location}.${field}`));
    return false;
  }
  return true;
}

function idMap(items, label, errors) {
  const result = new Map();
  for (const [index, item] of list(items).entries()) {
    const location = `${label}[${index}]`;
    const id = text(item?.id);
    if (!id) {
      errors.push(issue("MISSING_ID", `${location}.id is required.`, `${location}.id`));
      continue;
    }
    if (result.has(id)) {
      errors.push(issue("DUPLICATE_ID", `${label} contains duplicate id ${id}.`, location));
      continue;
    }
    result.set(id, item);
  }
  return result;
}

function walkStrings(value, visit, location = "$") {
  if (typeof value === "string") {
    visit(value, location);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkStrings(item, visit, `${location}[${index}]`));
    return;
  }
  if (!record(value)) return;
  for (const [key, item] of Object.entries(value)) {
    walkStrings(item, visit, `${location}.${key}`);
  }
}

function addTarget(targets, target, values) {
  const rendered = list(values).map(text).filter(Boolean).join("\n");
  if (rendered) targets.set(target, rendered);
}

/**
 * Return every canvas location whose wording makes a factual or interpretive claim.
 * IDs, rather than array indexes, keep mappings stable when content is reordered.
 */
export function collectClaimTargets(canvas, errors = []) {
  const targets = new Map();
  const brief = record(canvas?.characterBrief) ? canvas.characterBrief : {};

  addTarget(targets, "characterBrief.headline", [brief.headline]);
  addTarget(targets, "characterBrief.introduction", [brief.introduction]);
  addTarget(targets, "characterBrief.firstImpression.surface", [brief.firstImpression?.surface]);
  addTarget(targets, "characterBrief.firstImpression.reframed", [brief.firstImpression?.reframed]);
  addTarget(targets, "characterBrief.visualIdentity.summary", [brief.visualIdentity?.summary]);
  addTarget(targets, "characterBrief.visualIdentity.traits", brief.visualIdentity?.traits);

  for (const [sectionIndex, section] of list(brief.sections).entries()) {
    const sectionId = text(section?.id);
    if (!sectionId) {
      errors.push(issue("MISSING_TARGET_ID", `characterBrief.sections[${sectionIndex}].id is required for stable claim mapping.`, `canvas.characterBrief.sections[${sectionIndex}].id`));
      continue;
    }
    for (const [itemIndex, item] of list(section?.items).entries()) {
      const itemId = text(item?.id);
      if (!itemId) {
        errors.push(issue("MISSING_TARGET_ID", `Section ${sectionId} item ${itemIndex} needs an id for stable claim mapping.`, `canvas.characterBrief.sections[${sectionIndex}].items[${itemIndex}].id`));
        continue;
      }
      addTarget(targets, `characterBrief.sections.${sectionId}.${itemId}`, [item?.label, item?.statement]);
    }
  }

  addTarget(targets, "guide.title", [canvas?.guide?.title]);
  addTarget(targets, "guide.summary", [canvas?.guide?.summary]);

  for (const [index, step] of list(canvas?.guide?.steps).entries()) {
    const stepId = text(step?.id);
    if (!stepId) {
      errors.push(issue("MISSING_TARGET_ID", `guide.steps[${index}].id is required for stable claim mapping.`, `canvas.guide.steps[${index}].id`));
      continue;
    }
    addTarget(targets, `guide.steps.${stepId}`, [step?.title, step?.summary]);
  }

  for (const [index, node] of list(canvas?.nodes).entries()) {
    const nodeId = text(node?.id);
    if (!nodeId) {
      errors.push(issue("MISSING_TARGET_ID", `nodes[${index}].id is required for stable claim mapping.`, `canvas.nodes[${index}].id`));
      continue;
    }
    addTarget(targets, `nodes.${nodeId}.title`, [node?.title]);
    addTarget(targets, `nodes.${nodeId}.summary`, [node?.summary]);
    addTarget(targets, `nodes.${nodeId}.body`, [node?.body]);
  }

  for (const [index, edge] of list(canvas?.edges).entries()) {
    const edgeId = text(edge?.id);
    if (!edgeId) {
      errors.push(issue("MISSING_TARGET_ID", `edges[${index}].id is required for stable claim mapping.`, `canvas.edges[${index}].id`));
      continue;
    }
    addTarget(targets, `edges.${edgeId}.label`, [edge?.label]);
    addTarget(targets, `edges.${edgeId}.summary`, [edge?.summary]);
  }

  for (const [index, group] of list(canvas?.groups).entries()) {
    const groupId = text(group?.id);
    if (!groupId) {
      errors.push(issue("MISSING_TARGET_ID", `groups[${index}].id is required for stable claim mapping.`, `canvas.groups[${index}].id`));
      continue;
    }
    addTarget(targets, `groups.${groupId}.title`, [group?.title]);
    addTarget(targets, `groups.${groupId}.summary`, [group?.summary]);
  }

  for (const evidence of list(canvas?.evidence)) {
    const evidenceId = text(evidence?.id);
    if (!evidenceId) continue;
    for (const anchor of list(evidence?.anchors)) {
      const anchorId = text(anchor?.id);
      if (!anchorId) continue;
      addTarget(targets, `evidence.${evidenceId}.anchors.${anchorId}.supports`, [anchor?.supports]);
    }
  }

  return targets;
}

function validateDisplayEvidenceLabels(canvas, targets, claimsById, targetClaims, errors) {
  const units = [];
  const brief = record(canvas?.characterBrief) ? canvas.characterBrief : {};

  for (const section of list(brief.sections)) {
    for (const item of list(section?.items)) {
      const target = `characterBrief.sections.${String(section?.id)}.${String(item?.id)}`;
      if (targets.has(target)) units.push({ location: target, certainty: item?.certainty, targets: [target] });
    }
  }
  for (const node of list(canvas?.nodes)) {
    const prefix = `nodes.${String(node?.id)}`;
    units.push({
      location: prefix,
      certainty: node?.certainty,
      targets: [`${prefix}.title`, `${prefix}.summary`, `${prefix}.body`].filter((target) => targets.has(target)),
    });
  }
  for (const edge of list(canvas?.edges)) {
    const prefix = `edges.${String(edge?.id)}`;
    units.push({
      location: prefix,
      certainty: edge?.certainty,
      targets: [`${prefix}.label`, `${prefix}.summary`].filter((target) => targets.has(target)),
    });
  }

  for (const unit of units) {
    if (unit.targets.length === 0) continue;
    if (!hasValue(unit.certainty)) {
      errors.push(issue("MISSING_DISPLAY_EVIDENCE_LABEL", `${unit.location} has claim-bearing text but no reader-facing certainty label.`, `canvas.${unit.location}.certainty`));
      continue;
    }
    const classes = new Set();
    for (const target of unit.targets) {
      for (const claimId of targetClaims.get(target) ?? []) {
        const evidenceClass = claimsById.get(claimId)?.evidenceClass;
        if (EVIDENCE_CLASSES.has(evidenceClass) && evidenceClass !== "unverified") classes.add(evidenceClass);
      }
    }
    if (classes.size === 0) continue;
    const expected = classes.has("interpretation")
      ? "interpretation"
      : classes.size === 1
        ? [...classes][0]
        : null;
    if (expected === null) {
      errors.push(issue("MIXED_DISPLAY_EVIDENCE", `${unit.location} combines incompatible evidence classes (${[...classes].join(", ")}) under one reader label; split the display unit.`, `canvas.${unit.location}.certainty`));
    } else if (unit.certainty !== expected) {
      errors.push(issue("DISPLAY_EVIDENCE_MISMATCH", `${unit.location}.certainty is ${String(unit.certainty)} but its mapped claims require ${expected}.`, `canvas.${unit.location}.certainty`));
    }
  }
}

function validateScope(ledger, canvas, errors) {
  const scope = ledger?.scope;
  if (!record(scope)) {
    errors.push(issue("MISSING_SCOPE", "ledger.scope is required.", "ledger.scope"));
    return;
  }
  for (const field of ["character", "work", "researchMode", "medium", "versionOrAdaptation", "sourceBoundary", "spoilerCeiling", "outputLanguage"]) {
    pushRequired(errors, scope, field, "ledger.scope");
  }
  if (hasValue(scope.researchMode) && !["public", "supplied", "mixed"].includes(scope.researchMode)) {
    errors.push(issue("INVALID_RESEARCH_MODE", `ledger.scope.researchMode must be public, supplied, or mixed; received ${scope.researchMode}.`, "ledger.scope.researchMode"));
  }
  if (text(canvas?.metadata?.subject) && text(scope.character) && text(canvas.metadata.subject) !== text(scope.character)) {
    errors.push(issue("SCOPE_MISMATCH", "canvas.metadata.subject does not match ledger.scope.character.", "canvas.metadata.subject"));
  }
  if (text(canvas?.metadata?.language) && text(scope.outputLanguage) && text(canvas.metadata.language) !== text(scope.outputLanguage)) {
    errors.push(issue("SCOPE_MISMATCH", "canvas.metadata.language does not match ledger.scope.outputLanguage.", "canvas.metadata.language"));
  }
}

function validateCaseIds(canvas, ledger, verification, errors) {
  const canvasId = text(canvas?.metadata?.id);
  const ledgerId = text(ledger?.caseId);
  const verificationId = text(verification?.caseId);
  if (!canvasId) errors.push(issue("MISSING_CASE_ID", "canvas.metadata.id is required.", "canvas.metadata.id"));
  if (!ledgerId) errors.push(issue("MISSING_CASE_ID", "ledger.caseId is required.", "ledger.caseId"));
  if (!verificationId) errors.push(issue("MISSING_CASE_ID", "verification.caseId is required.", "verification.caseId"));
  const ids = [canvasId, ledgerId, verificationId].filter(Boolean);
  if (new Set(ids).size > 1) {
    errors.push(issue("CASE_ID_MISMATCH", `Canvas, ledger, and verification case IDs differ: ${ids.join(", ")}.`));
  }
}

function validateSourceScopes(ledger, errors) {
  if (!Array.isArray(ledger?.sourceScopes) || ledger.sourceScopes.length === 0) {
    errors.push(issue("MISSING_SOURCE_SCOPES", "ledger.sourceScopes must contain at least one source boundary.", "ledger.sourceScopes"));
  }
  const scopeById = idMap(ledger?.sourceScopes, "ledger.sourceScopes", errors);
  for (const [scopeId, scope] of scopeById) {
    const location = `ledger.sourceScopes.${scopeId}`;
    for (const field of ["title", "work", "medium", "version", "installmentRange"]) {
      pushRequired(errors, scope, field, location);
    }
  }
  return scopeById;
}

function tierIsValid(value) {
  if (Number.isInteger(value)) return value >= 1 && value <= 5;
  return typeof value === "string" && /^(?:tier[- ]?)?[1-5]$/i.test(value.trim());
}

function validateEvidence(ledger, scopeById, errors) {
  if (!Array.isArray(ledger?.evidence) || ledger.evidence.length === 0) {
    errors.push(issue("MISSING_EVIDENCE", "ledger.evidence must contain at least one source record.", "ledger.evidence"));
  }
  const evidenceById = idMap(ledger?.evidence, "ledger.evidence", errors);
  for (const [evidenceId, evidence] of evidenceById) {
    const location = `ledger.evidence.${evidenceId}`;
    for (const field of ["title", "urlOrLocation", "sourceClass", "originGroup", "locator"]) {
      pushRequired(errors, evidence, field, location);
    }
    if (!tierIsValid(evidence.sourceTier)) {
      errors.push(issue("INVALID_SOURCE_TIER", `${location}.sourceTier must identify tier 1 through 5.`, `${location}.sourceTier`));
    }
    if (/^https?:\/\//i.test(text(evidence.urlOrLocation))) {
      if (!hasValue(evidence.accessedAt)) {
        errors.push(issue("MISSING_ACCESS_DATE", `${location}.accessedAt is required for public web material.`, `${location}.accessedAt`));
      } else if (Number.isNaN(Date.parse(evidence.accessedAt))) {
        errors.push(issue("INVALID_TIMESTAMP", `${location}.accessedAt must be an ISO-compatible date or timestamp.`, `${location}.accessedAt`));
      }
    }
    if (!Array.isArray(evidence.sourceScopeIds) || evidence.sourceScopeIds.length === 0) {
      errors.push(issue("MISSING_SCOPE_REFERENCE", `${location}.sourceScopeIds must contain at least one source scope id.`, `${location}.sourceScopeIds`));
    }
    for (const scopeId of list(evidence.sourceScopeIds)) {
      if (!scopeById.has(scopeId)) {
        errors.push(issue("UNKNOWN_SCOPE", `${location} references unknown source scope ${scopeId}.`, `${location}.sourceScopeIds`));
      }
    }
  }
  return evidenceById;
}

function validateVisualReferences(ledger, scopeById, errors) {
  const visuals = ledger?.visualReferences;
  if (!Array.isArray(visuals)) {
    errors.push(issue("MISSING_VISUAL_REFERENCES", "ledger.visualReferences must be an array; use [] when no canonical visual is available.", "ledger.visualReferences"));
    return new Map();
  }
  const visualById = idMap(visuals, "ledger.visualReferences", errors);
  for (const [id, visual] of visualById) {
    const location = `ledger.visualReferences.${id}`;
    for (const field of ["label", "work", "assetKind", "canonicalStatus", "versionOrCostume", "publisherOrStudio", "sourcePage", "transformation"]) {
      pushRequired(errors, visual, field, location);
    }
    if (!Array.isArray(visual.sourceScopeIds) || visual.sourceScopeIds.length === 0) {
      errors.push(issue("MISSING_SCOPE_REFERENCE", `${location}.sourceScopeIds must contain at least one source scope id.`, `${location}.sourceScopeIds`));
    }
    for (const scopeId of list(visual.sourceScopeIds)) {
      if (!scopeById.has(scopeId)) {
        errors.push(issue("UNKNOWN_SCOPE", `${location} references unknown source scope ${scopeId}.`, `${location}.sourceScopeIds`));
      }
    }
    if (hasValue(visual.transformation) && !["original", "crop", "edited"].includes(visual.transformation)) {
      errors.push(issue("INVALID_VISUAL_TRANSFORMATION", `${location}.transformation must be original, crop, or edited.`, `${location}.transformation`));
    }
    for (const field of ["creatorCredit", "checksum"]) {
      if (!Object.hasOwn(visual, field)) {
        errors.push(issue("REQUIRED_FIELD", `${location}.${field} must be present; use null when genuinely unavailable or inapplicable.`, `${location}.${field}`));
      }
    }
    if ((hasValue(visual.localPath) || hasValue(visual.assetPath) || hasValue(visual.imagePath)) && !hasValue(visual.checksum)) {
      errors.push(issue("MISSING_VISUAL_CHECKSUM", `${location}.checksum is required when a local visual asset is embedded.`, `${location}.checksum`));
    }
  }
  return visualById;
}

function checkReferences(ids, known, code, label, location, errors) {
  for (const id of list(ids)) {
    if (!known.has(id)) {
      errors.push(issue(code, `${label} references unknown id ${String(id)}.`, location));
    }
  }
}

function validateCanvasEvidenceAnchors(canvas, nodeById, edgeById, errors) {
  const anchorLocations = new Map();
  const anchorTargetsByEvidence = new Map();

  for (const [evidenceIndex, evidence] of list(canvas?.evidence).entries()) {
    if (!record(evidence) || !Object.hasOwn(evidence, "anchors")) continue;

    const evidenceId = text(evidence.id);
    const evidenceLocation = evidenceId
      ? `canvas.evidence.${evidenceId}`
      : `canvas.evidence[${evidenceIndex}]`;
    if (!Array.isArray(evidence.anchors)) {
      errors.push(issue("INVALID_EVIDENCE_ANCHORS", `${evidenceLocation}.anchors must be an array when present.`, `${evidenceLocation}.anchors`));
      continue;
    }

    for (const [anchorIndex, anchor] of evidence.anchors.entries()) {
      const indexedLocation = `${evidenceLocation}.anchors[${anchorIndex}]`;
      const anchorId = text(anchor?.id);
      const location = anchorId
        ? `${evidenceLocation}.anchors.${anchorId}`
        : indexedLocation;

      if (!anchorId) {
        errors.push(issue("MISSING_ANCHOR_ID", `${indexedLocation}.id is required.`, `${indexedLocation}.id`));
      } else if (anchorLocations.has(anchorId)) {
        errors.push(issue("DUPLICATE_ANCHOR_ID", `Anchor id ${anchorId} must be globally unique; it is already used at ${anchorLocations.get(anchorId)}.`, location));
      } else {
        anchorLocations.set(anchorId, location);
      }

      for (const field of ["locator", "supports"]) {
        if (!text(anchor?.[field])) {
          errors.push(issue("REQUIRED_FIELD", `${location}.${field} must be a non-empty string.`, `${location}.${field}`));
        }
      }

      const hasExcerpt = record(anchor) && Object.hasOwn(anchor, "excerpt");
      const hasObservation = record(anchor) && Object.hasOwn(anchor, "observation");
      if (hasExcerpt === hasObservation) {
        errors.push(issue("INVALID_ANCHOR_BASIS", `${location} must contain exactly one of excerpt or observation.`, location));
      } else {
        const field = hasExcerpt ? "excerpt" : "observation";
        if (!text(anchor[field])) {
          errors.push(issue("INVALID_ANCHOR_BASIS", `${location}.${field} must be a non-empty string.`, `${location}.${field}`));
        }
      }

      for (const field of ["speaker", "context"]) {
        if (record(anchor) && Object.hasOwn(anchor, field) && !text(anchor[field])) {
          errors.push(issue("EMPTY_ANCHOR_OPTIONAL_FIELD", `${location}.${field} must be a non-empty string when present.`, `${location}.${field}`));
        }
      }

      if (!Array.isArray(anchor?.targetIds) || anchor.targetIds.length === 0) {
        errors.push(issue("MISSING_ANCHOR_TARGETS", `${location}.targetIds must contain at least one node or edge id.`, `${location}.targetIds`));
        continue;
      }

      for (const [targetIndex, rawTargetId] of anchor.targetIds.entries()) {
        const targetId = text(rawTargetId);
        const targetLocation = `${location}.targetIds[${targetIndex}]`;
        if (!targetId) {
          errors.push(issue("INVALID_ANCHOR_TARGET_ID", `${targetLocation} must be a non-empty string.`, targetLocation));
          continue;
        }

        const entities = [nodeById.get(targetId), edgeById.get(targetId)].filter(Boolean);
        if (entities.length === 0) {
          errors.push(issue("UNKNOWN_ANCHOR_TARGET", `${location} references unknown node or edge ${targetId}.`, targetLocation));
          continue;
        }

        if (!anchorTargetsByEvidence.has(evidenceId)) {
          anchorTargetsByEvidence.set(evidenceId, new Set());
        }
        anchorTargetsByEvidence.get(evidenceId).add(targetId);
        for (const entity of entities) {
          const entityEvidenceIds = new Set(list(entity.evidenceIds).map(text).filter(Boolean));
          if (evidenceId && !entityEvidenceIds.has(evidenceId)) {
            errors.push(issue("ANCHOR_EVIDENCE_MISMATCH", `Anchor ${anchorId || anchorIndex} targets ${targetId}, but that entity does not reference evidence ${evidenceId}.`, targetLocation));
          }
        }
      }
    }
  }

  if (canvas?.metadata?.evidenceMode !== "anchored") return;
  for (const [entityLabel, collection, entitiesById] of [
    ["Node", "nodes", nodeById],
    ["Edge", "edges", edgeById],
  ]) {
    for (const [entityId, entity] of entitiesById) {
      for (const evidenceId of list(entity.evidenceIds).map(text).filter(Boolean)) {
        if (!anchorTargetsByEvidence.get(evidenceId)?.has(entityId)) {
          errors.push(issue("MISSING_TARGET_ANCHOR", `${entityLabel} ${entityId} references evidence ${evidenceId}, but that evidence has no anchor targeting the ${entityLabel.toLowerCase()}.`, `canvas.${collection}.${entityId}.evidenceIds`));
        }
      }
    }
  }
}

function validateCanvasReferences(canvas, scopeById, canvasEvidenceById, visualById, errors) {
  const brief = canvas?.characterBrief;
  if (!record(brief)) {
    errors.push(issue("MISSING_CHARACTER_BRIEF", "canvas.characterBrief is required for a character-first case.", "canvas.characterBrief"));
  } else {
    for (const field of ["title", "headline", "introduction"]) {
      pushRequired(errors, brief, field, "canvas.characterBrief");
    }
    if (!Array.isArray(brief.sourceScopes) || brief.sourceScopes.length === 0) {
      errors.push(issue("MISSING_BRIEF_SOURCE_SCOPES", "canvas.characterBrief.sourceScopes must expose at least one source boundary.", "canvas.characterBrief.sourceScopes"));
    }
    const briefScopes = idMap(brief.sourceScopes, "canvas.characterBrief.sourceScopes", errors);
    for (const [scopeId, scope] of briefScopes) {
      for (const field of ["title", "medium", "scope"]) {
        pushRequired(errors, scope, field, `canvas.characterBrief.sourceScopes.${scopeId}`);
      }
      if (!scopeById.has(scopeId)) {
        errors.push(issue("UNKNOWN_SCOPE", `Character brief exposes unknown source scope ${scopeId}.`, `canvas.characterBrief.sourceScopes.${scopeId}`));
      }
    }
    if (!record(brief.firstImpression)) {
      errors.push(issue("MISSING_FIRST_IMPRESSION", "canvas.characterBrief.firstImpression is required.", "canvas.characterBrief.firstImpression"));
    } else {
      pushRequired(errors, brief.firstImpression, "surface", "canvas.characterBrief.firstImpression");
      pushRequired(errors, brief.firstImpression, "reframed", "canvas.characterBrief.firstImpression");
      checkReferences(brief.firstImpression.evidenceIds, canvasEvidenceById, "UNKNOWN_CANVAS_EVIDENCE", "First impression", "canvas.characterBrief.firstImpression.evidenceIds", errors);
    }
    if (!Array.isArray(brief.sections) || brief.sections.length === 0) {
      errors.push(issue("MISSING_BRIEF_SECTIONS", "canvas.characterBrief.sections must contain at least one section.", "canvas.characterBrief.sections"));
    }
    for (const section of list(brief.sections)) {
      for (const item of list(section?.items)) {
        checkReferences(item?.scopeIds, scopeById, "UNKNOWN_SCOPE", `Brief item ${String(item?.id)}`, `canvas.characterBrief.sections.${String(section?.id)}.${String(item?.id)}.scopeIds`, errors);
        checkReferences(item?.evidenceIds, canvasEvidenceById, "UNKNOWN_CANVAS_EVIDENCE", `Brief item ${String(item?.id)}`, `canvas.characterBrief.sections.${String(section?.id)}.${String(item?.id)}.evidenceIds`, errors);
      }
    }
    for (const visual of list(brief.visualIdentity?.references)) {
      const visualId = text(visual?.id);
      if (!visualById.has(visualId)) {
        errors.push(issue("UNLEDGERED_VISUAL_REFERENCE", `Canvas visual ${visualId || "?"} is absent from ledger.visualReferences.`, `canvas.characterBrief.visualIdentity.references.${visualId || "?"}`));
      }
      if (hasValue(visual?.evidenceId) && !canvasEvidenceById.has(visual.evidenceId)) {
        errors.push(issue("UNKNOWN_CANVAS_EVIDENCE", `Canvas visual ${visualId || "?"} references unknown evidence ${String(visual.evidenceId)}.`, `canvas.characterBrief.visualIdentity.references.${visualId || "?"}.evidenceId`));
      }
    }
  }

  const nodeById = idMap(canvas?.nodes, "canvas.nodes", errors);
  const edgeById = idMap(canvas?.edges, "canvas.edges", errors);
  const groupById = idMap(canvas?.groups, "canvas.groups", errors);
  const viewById = idMap(canvas?.views, "canvas.views", errors);
  if (nodeById.size === 0) errors.push(issue("MISSING_CANVAS_NODES", "canvas.nodes must contain at least one node.", "canvas.nodes"));
  if (viewById.size === 0) errors.push(issue("MISSING_CANVAS_VIEWS", "canvas.views must contain at least one view.", "canvas.views"));

  for (const [nodeId, node] of nodeById) {
    checkReferences(node.evidenceIds, canvasEvidenceById, "UNKNOWN_CANVAS_EVIDENCE", `Node ${nodeId}`, `canvas.nodes.${nodeId}.evidenceIds`, errors);
    checkReferences(node.groupIds, groupById, "UNKNOWN_GROUP", `Node ${nodeId}`, `canvas.nodes.${nodeId}.groupIds`, errors);
  }
  for (const [edgeId, edge] of edgeById) {
    checkReferences([edge.source, edge.target], nodeById, "UNKNOWN_NODE", `Edge ${edgeId}`, `canvas.edges.${edgeId}`, errors);
    checkReferences(edge.evidenceIds, canvasEvidenceById, "UNKNOWN_CANVAS_EVIDENCE", `Edge ${edgeId}`, `canvas.edges.${edgeId}.evidenceIds`, errors);
  }
  for (const [viewId, view] of viewById) {
    checkReferences(view.visibleNodeIds, nodeById, "UNKNOWN_NODE", `View ${viewId}`, `canvas.views.${viewId}.visibleNodeIds`, errors);
    checkReferences(view.visibleEdgeIds, edgeById, "UNKNOWN_EDGE", `View ${viewId}`, `canvas.views.${viewId}.visibleEdgeIds`, errors);
    checkReferences(view.visibleGroupIds, groupById, "UNKNOWN_GROUP", `View ${viewId}`, `canvas.views.${viewId}.visibleGroupIds`, errors);
  }

  const guide = canvas?.guide;
  if (!record(guide) || !Array.isArray(guide.steps)) {
    errors.push(issue("MISSING_CORE_PATH", "canvas.guide.steps is required.", "canvas.guide.steps"));
  } else {
    pushRequired(errors, guide, "title", "canvas.guide");
    pushRequired(errors, guide, "summary", "canvas.guide");
    if (guide.steps.length < 5 || guide.steps.length > 9) {
      errors.push(issue("INVALID_CORE_PATH_LENGTH", `canvas.guide.steps must contain 5 through 9 meaningful changes; received ${guide.steps.length}.`, "canvas.guide.steps"));
    }
    const guideIds = new Set();
    for (const [index, step] of guide.steps.entries()) {
      const stepId = text(step?.id);
      if (!stepId) errors.push(issue("MISSING_ID", `canvas.guide.steps[${index}].id is required.`, `canvas.guide.steps[${index}].id`));
      else if (guideIds.has(stepId)) errors.push(issue("DUPLICATE_ID", `canvas.guide.steps contains duplicate id ${stepId}.`, `canvas.guide.steps[${index}]`));
      else guideIds.add(stepId);
      checkReferences([step?.viewId], viewById, "UNKNOWN_VIEW", `Guide step ${stepId || index}`, `canvas.guide.steps.${stepId || index}.viewId`, errors);
      checkReferences([step?.nodeId], nodeById, "UNKNOWN_NODE", `Guide step ${stepId || index}`, `canvas.guide.steps.${stepId || index}.nodeId`, errors);
    }
  }

  if (record(brief?.firstImpression) && hasValue(brief.firstImpression.nodeId)) {
    checkReferences([brief.firstImpression.nodeId], nodeById, "UNKNOWN_NODE", "First impression", "canvas.characterBrief.firstImpression.nodeId", errors);
  }
  for (const section of list(brief?.sections)) {
    for (const item of list(section?.items)) {
      if (hasValue(item?.nodeId)) {
        checkReferences([item.nodeId], nodeById, "UNKNOWN_NODE", `Brief item ${String(item?.id)}`, `canvas.characterBrief.sections.${String(section?.id)}.${String(item?.id)}.nodeId`, errors);
      }
    }
  }

  validateCanvasEvidenceAnchors(canvas, nodeById, edgeById, errors);

  return viewById;
}

function validateClaims(ledger, evidenceById, canvasEvidenceById, scopeById, targets, errors, warnings) {
  if (!Array.isArray(ledger?.claims) || ledger.claims.length === 0) {
    errors.push(issue("MISSING_CLAIMS", "ledger.claims must contain at least one atomic claim.", "ledger.claims"));
  }
  const claimsById = idMap(ledger?.claims, "ledger.claims", errors);
  const targetClaims = new Map([...targets.keys()].map((target) => [target, []]));

  for (const [claimId, claim] of claimsById) {
    const location = `ledger.claims.${claimId}`;
    for (const field of ["category", "statement", "sceneOrObservableBasis"]) pushRequired(errors, claim, field, location);

    if (!CLAIM_TYPES.has(claim.claimType)) {
      errors.push(issue("INVALID_CLAIM_TYPE", `${location}.claimType is invalid: ${String(claim.claimType)}.`, `${location}.claimType`));
    } else if (claim.claimType === "unverified") {
      errors.push(issue("UNVERIFIED_VALUE", `${location}.claimType is still unverified.`, `${location}.claimType`));
    }
    if (!EVIDENCE_CLASSES.has(claim.evidenceClass)) {
      errors.push(issue("INVALID_EVIDENCE_CLASS", `${location}.evidenceClass is invalid: ${String(claim.evidenceClass)}.`, `${location}.evidenceClass`));
    } else if (claim.evidenceClass === "unverified") {
      errors.push(issue("UNVERIFIED_VALUE", `${location}.evidenceClass is still unverified.`, `${location}.evidenceClass`));
    }
    const compatibleEvidence = CLAIM_EVIDENCE_COMPATIBILITY.get(claim.claimType);
    if (compatibleEvidence && EVIDENCE_CLASSES.has(claim.evidenceClass) && !compatibleEvidence.has(claim.evidenceClass)) {
      errors.push(issue("CLAIM_EVIDENCE_MISMATCH", `${location}.claimType ${claim.claimType} cannot use evidenceClass ${claim.evidenceClass}.`, `${location}.evidenceClass`));
    }
    if (!CAUSAL_BASES.has(claim.causalBasis)) {
      errors.push(issue("INVALID_CAUSAL_BASIS", `${location}.causalBasis is invalid: ${String(claim.causalBasis)}.`, `${location}.causalBasis`));
    }

    if (!Array.isArray(claim.qualifiers)) {
      errors.push(issue("INVALID_QUALIFIERS", `${location}.qualifiers must be an array.`, `${location}.qualifiers`));
    }
    const qualifiers = new Set(list(claim.qualifiers));
    for (const qualifier of qualifiers) {
      if (!QUALIFIERS.has(qualifier)) {
        errors.push(issue("INVALID_QUALIFIER", `${location} contains invalid qualifier ${String(qualifier)}.`, `${location}.qualifiers`));
      }
    }
    if (qualifiers.has("conditional") && !hasValue(claim.condition)) {
      errors.push(issue("MISSING_CONDITION", `${location} is conditional but has no condition.`, `${location}.condition`));
    }
    if (qualifiers.has("attributed") && !hasValue(claim.attribution)) {
      errors.push(issue("MISSING_ATTRIBUTION", `${location} is attributed but has no attribution.`, `${location}.attribution`));
    }
    if (qualifiers.has("disputed") && (!Array.isArray(claim.conflicts) || claim.conflicts.length === 0)) {
      errors.push(issue("MISSING_CONFLICT", `${location} is disputed but has no conflict record.`, `${location}.conflicts`));
    }
    if (hasValue(claim.condition) && !qualifiers.has("conditional")) {
      errors.push(issue("UNDECLARED_CONDITION", `${location} has a condition but lacks the conditional qualifier.`, `${location}.qualifiers`));
    }
    if (hasValue(claim.attribution) && !qualifiers.has("attributed")) {
      errors.push(issue("UNDECLARED_ATTRIBUTION", `${location} has attribution but lacks the attributed qualifier.`, `${location}.qualifiers`));
    }
    if (list(claim.conflicts).length > 0 && !qualifiers.has("disputed")) {
      errors.push(issue("UNDECLARED_CONFLICT", `${location} has conflicts but lacks the disputed qualifier.`, `${location}.qualifiers`));
    }

    if (!Array.isArray(claim.sourceScopeIds) || claim.sourceScopeIds.length === 0) {
      errors.push(issue("MISSING_SCOPE_REFERENCE", `${location}.sourceScopeIds must contain at least one source scope id.`, `${location}.sourceScopeIds`));
    }
    for (const scopeId of list(claim.sourceScopeIds)) {
      if (!scopeById.has(scopeId)) {
        errors.push(issue("UNKNOWN_SCOPE", `${location} references unknown source scope ${scopeId}.`, `${location}.sourceScopeIds`));
      }
    }

    if (!Array.isArray(claim.evidenceIds) || claim.evidenceIds.length === 0) {
      errors.push(issue("MISSING_EVIDENCE_REFERENCE", `${location}.evidenceIds must contain at least one evidence id.`, `${location}.evidenceIds`));
    }
    const evidenceRecords = [];
    for (const evidenceId of list(claim.evidenceIds)) {
      const evidence = evidenceById.get(evidenceId);
      if (!evidence) {
        errors.push(issue("UNKNOWN_EVIDENCE", `${location} references unknown evidence ${evidenceId}.`, `${location}.evidenceIds`));
      } else {
        evidenceRecords.push(evidence);
      }
    }
    if (list(claim.displayTargets).some((target) => targets.has(target))) {
      for (const evidenceId of list(claim.evidenceIds)) {
        if (!canvasEvidenceById.has(evidenceId)) {
          errors.push(issue("UNPROJECTED_DISPLAY_EVIDENCE", `Displayed claim ${claimId} relies on ${evidenceId}, but that evidence is absent from canvas.evidence.`, `${location}.evidenceIds`));
        }
      }
    }
    if (claim.evidenceClass === "cross-checked-secondary") {
      const origins = new Set(evidenceRecords.map((evidence) => text(evidence.originGroup)).filter(Boolean));
      if (origins.size < 2) {
        errors.push(issue("NOT_INDEPENDENTLY_CROSS_CHECKED", `${location} claims cross-checked-secondary support but its evidence resolves to fewer than two independent originGroup values.`, `${location}.evidenceIds`));
      }
    }

    if (!Array.isArray(claim.displayTargets)) {
      errors.push(issue("INVALID_DISPLAY_TARGETS", `${location}.displayTargets must be an array.`, `${location}.displayTargets`));
    }
    for (const target of list(claim.displayTargets)) {
      if (!targets.has(target)) {
        errors.push(issue("UNKNOWN_DISPLAY_TARGET", `${location} references unknown display target ${String(target)}.`, `${location}.displayTargets`));
        continue;
      }
      targetClaims.get(target).push(claimId);
    }
    if (list(claim.displayTargets).length === 0) {
      warnings.push(issue("UNDISPLAYED_CLAIM", `${location} is retained in research but is not projected into the canvas.`, `${location}.displayTargets`));
    }
  }

  for (const [target, claimIds] of targetClaims) {
    if (claimIds.length === 0) {
      errors.push(issue("UNMAPPED_DISPLAY_TARGET", `${target} has displayed wording but no ledger claim maps to it.`, `canvas.${target}`));
    }
  }
  return { claimsById, targetClaims };
}

function validateViewCharters(views, ledger, errors, warnings) {
  if (!Array.isArray(ledger?.viewCharters) || ledger.viewCharters.length === 0) {
    errors.push(issue("MISSING_VIEW_CHARTERS", "ledger.viewCharters must contain one charter for every canvas view.", "ledger.viewCharters"));
  }
  const charters = new Map();
  for (const [index, charter] of list(ledger?.viewCharters).entries()) {
    const location = `ledger.viewCharters[${index}]`;
    const viewId = text(charter?.viewId);
    if (!viewId) {
      errors.push(issue("MISSING_VIEW_ID", `${location}.viewId is required.`, `${location}.viewId`));
      continue;
    }
    if (charters.has(viewId)) {
      errors.push(issue("DUPLICATE_VIEW_CHARTER", `ledger.viewCharters contains duplicate viewId ${viewId}.`, location));
      continue;
    }
    charters.set(viewId, charter);
    for (const field of ["question", "inScope", "outOfScope", "whyThisViewExists"]) pushRequired(errors, charter, field, location);
  }

  for (const viewId of views.keys()) {
    if (!charters.has(viewId)) {
      errors.push(issue("MISSING_VIEW_CHARTER", `Canvas view ${viewId} has no ledger view charter.`, `canvas.views.${viewId}`));
    }
  }
  for (const viewId of charters.keys()) {
    if (!views.has(viewId)) {
      errors.push(issue("ORPHAN_VIEW_CHARTER", `Ledger view charter ${viewId} does not match a canvas view.`, `ledger.viewCharters.${viewId}`));
    }
  }

  const viewEntries = [...views.entries()];
  for (let left = 0; left < viewEntries.length; left += 1) {
    for (let right = left + 1; right < viewEntries.length; right += 1) {
      const [leftId, leftView] = viewEntries[left];
      const [rightId, rightView] = viewEntries[right];
      const leftItems = new Set([
        ...list(leftView.visibleNodeIds).map((id) => `node:${id}`),
        ...list(leftView.visibleEdgeIds).map((id) => `edge:${id}`),
      ]);
      const rightItems = new Set([
        ...list(rightView.visibleNodeIds).map((id) => `node:${id}`),
        ...list(rightView.visibleEdgeIds).map((id) => `edge:${id}`),
      ]);
      const union = new Set([...leftItems, ...rightItems]);
      if (union.size === 0) continue;
      const intersection = [...leftItems].filter((item) => rightItems.has(item)).length;
      const score = intersection / union.size;
      if (score > 0.75) {
        warnings.push(issue("VIEW_OVERLAP", `Views ${leftId} and ${rightId} have ${(score * 100).toFixed(0)}% node/edge overlap; confirm that they answer genuinely different questions.`, "canvas.views"));
      }
    }
  }
}

function validateCanvasEvidenceProjection(canvas, evidenceById, errors) {
  if (!Array.isArray(canvas?.evidence)) {
    errors.push(issue("MISSING_CANVAS_EVIDENCE", "canvas.evidence must be an array.", "canvas.evidence"));
    return new Map();
  }
  const canvasEvidence = idMap(canvas.evidence, "canvas.evidence", errors);
  for (const id of canvasEvidence.keys()) {
    if (!evidenceById.has(id)) {
      errors.push(issue("UNLEDGERED_CANVAS_EVIDENCE", `Canvas evidence ${id} is not defined in ledger.evidence.`, `canvas.evidence.${id}`));
    }
  }
  return canvasEvidence;
}

function validateVerification(ledger, verification, claimsById, evidenceById, targetClaims, targets, errors, warnings) {
  const metadata = verification?.metadata;
  if (!record(metadata)) {
    errors.push(issue("MISSING_VERIFICATION_METADATA", "verification.metadata is required.", "verification.metadata"));
  } else {
    if (!COMPLETE_VERIFICATION_STATUSES.has(metadata.status)) {
      errors.push(issue("VERIFICATION_NOT_COMPLETE", `verification.metadata.status must be complete; received ${String(metadata.status)}.`, "verification.metadata.status"));
    }
    pushRequired(errors, metadata, "verifierRunId", "verification.metadata");
    pushRequired(errors, metadata, "verifiedAt", "verification.metadata");
    if (hasValue(metadata.verifiedAt) && Number.isNaN(Date.parse(metadata.verifiedAt))) {
      errors.push(issue("INVALID_TIMESTAMP", "verification.metadata.verifiedAt must be an ISO-compatible timestamp.", "verification.metadata.verifiedAt"));
    }
    if (metadata.independentSubagent !== true) {
      errors.push(issue("NO_INDEPENDENT_SUBAGENT", "Independent sub-agent verification is required.", "verification.metadata.independentSubagent"));
    }
    if (metadata.isolatedContext !== true) {
      errors.push(issue("VERIFIER_CONTEXT_NOT_ISOLATED", "The verifier must run without inheriting the producer's reasoning.", "verification.metadata.isolatedContext"));
    }
    if (metadata.sourceReviewPerformed !== true) {
      errors.push(issue("NO_SOURCE_REVIEW", "The verifier must independently review source material.", "verification.metadata.sourceReviewPerformed"));
    }
    if (["public", "mixed"].includes(ledger?.scope?.researchMode) && metadata.publicWebSearchPerformed !== true) {
      errors.push(issue("NO_INDEPENDENT_WEB_SEARCH", `Research mode ${ledger.scope.researchMode} requires the verifier to perform its own public web search.`, "verification.metadata.publicWebSearchPerformed"));
    }
  }

  if (!Array.isArray(verification?.claims)) {
    errors.push(issue("MISSING_CLAIM_VERDICTS", "verification.claims must be an array.", "verification.claims"));
  }
  const verdictByClaimId = new Map();
  for (const [index, result] of list(verification?.claims).entries()) {
    const location = `verification.claims[${index}]`;
    const claimId = text(result?.claimId);
    if (!claimId) {
      errors.push(issue("MISSING_CLAIM_ID", `${location}.claimId is required.`, `${location}.claimId`));
      continue;
    }
    if (verdictByClaimId.has(claimId)) {
      errors.push(issue("DUPLICATE_VERDICT", `Verification contains duplicate verdicts for ${claimId}.`, location));
      continue;
    }
    verdictByClaimId.set(claimId, result);
    const claim = claimsById.get(claimId);
    if (!claim) {
      errors.push(issue("UNKNOWN_VERIFIED_CLAIM", `Verification references unknown claim ${claimId}.`, `${location}.claimId`));
      continue;
    }
    if (!VERDICTS.has(result.verdict)) {
      errors.push(issue("INVALID_VERDICT", `${location}.verdict is invalid: ${String(result.verdict)}.`, `${location}.verdict`));
      continue;
    }

    if (!Array.isArray(result.checkedEvidenceIds) || result.checkedEvidenceIds.length === 0) {
      errors.push(issue("MISSING_CHECKED_EVIDENCE", `${location}.checkedEvidenceIds must name what the verifier independently reviewed.`, `${location}.checkedEvidenceIds`));
    }
    const checkedOrigins = new Set();
    const checkedEvidenceIds = new Set(list(result.checkedEvidenceIds));
    for (const evidenceId of list(result.checkedEvidenceIds)) {
      const evidence = evidenceById.get(evidenceId);
      if (!evidence) {
        errors.push(issue("UNKNOWN_CHECKED_EVIDENCE", `${location} references unknown checked evidence ${evidenceId}.`, `${location}.checkedEvidenceIds`));
      } else {
        checkedOrigins.add(text(evidence.originGroup));
      }
    }
    if (!Array.isArray(result.independentOriginGroups) || result.independentOriginGroups.length === 0) {
      errors.push(issue("MISSING_VERIFIED_ORIGINS", `${location}.independentOriginGroups must record the origins the verifier checked.`, `${location}.independentOriginGroups`));
    }
    const declaredOrigins = new Set(list(result.independentOriginGroups));
    for (const origin of declaredOrigins) {
      if (!checkedOrigins.has(origin)) {
        errors.push(issue("ORIGIN_EVIDENCE_MISMATCH", `${location} lists origin ${String(origin)} without checked evidence from that origin.`, `${location}.independentOriginGroups`));
      }
    }
    for (const origin of checkedOrigins) {
      if (origin && !declaredOrigins.has(origin)) {
        errors.push(issue("ORIGIN_EVIDENCE_MISMATCH", `${location} checked evidence from ${origin} but omitted that origin from independentOriginGroups.`, `${location}.independentOriginGroups`));
      }
    }
    for (const evidenceId of list(claim.evidenceIds)) {
      if (!checkedEvidenceIds.has(evidenceId)) {
        errors.push(issue("UNCHECKED_CLAIM_EVIDENCE", `${location} did not independently review claim evidence ${evidenceId}.`, `${location}.checkedEvidenceIds`));
      }
    }
    if (claim.evidenceClass === "cross-checked-secondary" && declaredOrigins.size < 2) {
      errors.push(issue("VERIFIER_DID_NOT_CROSS_CHECK", `${location} verifies a cross-checked-secondary claim with fewer than two independent origins.`, `${location}.independentOriginGroups`));
    }
    pushRequired(errors, result, "notes", location);

    const displayed = list(claim.displayTargets).length > 0;
    if (displayed && BLOCKING_VERDICTS.has(result.verdict)) {
      errors.push(issue("BLOCKED_DISPLAY_CLAIM", `Displayed claim ${claimId} has blocking verdict ${result.verdict}.`, `${location}.verdict`));
    } else if (!displayed && BLOCKING_VERDICTS.has(result.verdict)) {
      warnings.push(issue("BLOCKED_UNDISPLAYED_CLAIM", `Undisplayed claim ${claimId} retains verifier verdict ${result.verdict}; keep it out of the projection.`, `${location}.verdict`));
    }

    if (result.verdict === "partially-confirmed") {
      if (!Array.isArray(result.requiredQualifiers) || result.requiredQualifiers.length === 0) {
        errors.push(issue("MISSING_REQUIRED_QUALIFIERS", `Partially confirmed claim ${claimId} must list requiredQualifiers.`, `${location}.requiredQualifiers`));
      }
      const claimQualifiers = new Set(list(claim.qualifiers));
      for (const qualifier of list(result.requiredQualifiers)) {
        if (!QUALIFIERS.has(qualifier)) {
          errors.push(issue("INVALID_REQUIRED_QUALIFIER", `${location} requires invalid qualifier ${String(qualifier)}.`, `${location}.requiredQualifiers`));
        } else if (!claimQualifiers.has(qualifier)) {
          errors.push(issue("DROPPED_REQUIRED_QUALIFIER", `Claim ${claimId} does not retain verifier-required qualifier ${qualifier}.`, `ledger.claims.${claimId}.qualifiers`));
        }
      }
    }
    if (result.verdict === "interpretation-reasonable" && claim.claimType !== "interpretation") {
      errors.push(issue("VERDICT_TYPE_MISMATCH", `Claim ${claimId} received interpretation-reasonable but claimType is ${String(claim.claimType)}.`, `${location}.verdict`));
    }
  }

  for (const claimId of claimsById.keys()) {
    if (!verdictByClaimId.has(claimId)) {
      errors.push(issue("MISSING_CLAIM_VERDICT", `Ledger claim ${claimId} has no verifier verdict.`, `ledger.claims.${claimId}`));
    }
  }

  const projection = verification?.projectionReview;
  if (!record(projection)) {
    errors.push(issue("MISSING_PROJECTION_REVIEW", "verification.projectionReview is required.", "verification.projectionReview"));
    return;
  }
  if (projection.status !== "passed") {
    errors.push(issue("PROJECTION_NOT_PASSED", `verification.projectionReview.status must be passed; received ${String(projection.status)}.`, "verification.projectionReview.status"));
  }
  pushRequired(errors, projection, "verifierRunId", "verification.projectionReview");
  if (hasValue(projection.verifierRunId) && hasValue(metadata?.verifierRunId) && projection.verifierRunId !== metadata.verifierRunId) {
    errors.push(issue("PROJECTION_VERIFIER_MISMATCH", "Projection review must be completed by the same independent verifier run as claim-level verification.", "verification.projectionReview.verifierRunId"));
  }
  pushRequired(errors, projection, "reviewedAt", "verification.projectionReview");
  if (hasValue(projection.reviewedAt) && Number.isNaN(Date.parse(projection.reviewedAt))) {
    errors.push(issue("INVALID_TIMESTAMP", "verification.projectionReview.reviewedAt must be an ISO-compatible timestamp.", "verification.projectionReview.reviewedAt"));
  } else if (hasValue(metadata?.verifiedAt) && !Number.isNaN(Date.parse(metadata.verifiedAt)) && Date.parse(projection.reviewedAt) < Date.parse(metadata.verifiedAt)) {
    errors.push(issue("PROJECTION_REVIEW_OUT_OF_ORDER", "Projection review cannot predate the claim-level verification pass.", "verification.projectionReview.reviewedAt"));
  }
  if (!Array.isArray(projection.reviewedTargets)) {
    errors.push(issue("MISSING_REVIEWED_TARGETS", "verification.projectionReview.reviewedTargets must be an array.", "verification.projectionReview.reviewedTargets"));
  }
  const reviewedTargets = new Set(list(projection.reviewedTargets));
  for (const target of targets.keys()) {
    if (!reviewedTargets.has(target)) {
      errors.push(issue("UNREVIEWED_DISPLAY_TARGET", `Projection review did not cover ${target}.`, `canvas.${target}`));
    }
  }
  for (const target of reviewedTargets) {
    if (!targets.has(target)) {
      warnings.push(issue("UNKNOWN_REVIEWED_TARGET", `Projection review lists ${String(target)}, which is not a current claim-bearing target.`, "verification.projectionReview.reviewedTargets"));
    }
  }
  if (!Array.isArray(projection.findings)) {
    errors.push(issue("MISSING_PROJECTION_FINDINGS", "verification.projectionReview.findings must be an array; use [] when none remain.", "verification.projectionReview.findings"));
  }
  for (const [index, finding] of list(projection.findings).entries()) {
    if (["P0", "P1"].includes(finding?.severity) && !CLOSED_FINDING_STATUSES.has(finding?.status)) {
      errors.push(issue("OPEN_HIGH_PRIORITY_DRIFT", `Projection finding ${index} is ${finding.severity} and not resolved.`, `verification.projectionReview.findings[${index}]`));
    }
  }

  // targetClaims is deliberately consumed here: an empty mapping is already an error,
  // but keeping verification tied to the same target set prevents future validator drift.
  for (const target of targets.keys()) {
    if (!targetClaims.has(target)) {
      errors.push(issue("INTERNAL_TARGET_GAP", `No target mapping record was created for ${target}.`));
    }
  }
}

function semanticWarnings(canvas, targets, warnings) {
  const language = text(canvas?.metadata?.language).toLowerCase();
  const chinese = language === "zh-cn" || language === "zh-hans" || language.startsWith("zh-");

  for (const [target, rendered] of targets) {
    const strong = STRONG_TERMS.filter((term) => rendered.includes(term));
    if (strong.length > 0) {
      warnings.push(issue("STRONG_WORDING", `${target} uses strong wording (${strong.join("、")}); confirm that modality, causality, and scope support it.`, `canvas.${target}`));
    }
    if (!chinese) continue;
    const translated = TRANSLATIONESE.filter(([, pattern]) => pattern.test(rendered)).map(([label]) => label);
    if (translated.length > 0) {
      warnings.push(issue("TRANSLATIONESE", `${target} contains formulaic or translated analytical phrasing (${translated.join("、")}); rewrite in concrete, natural Chinese without dropping qualifiers.`, `canvas.${target}`));
    }
  }

  const headline = text(canvas?.characterBrief?.headline);
  const introduction = text(canvas?.characterBrief?.introduction);
  if ([...headline].length > 70) {
    warnings.push(issue("LONG_HEADLINE", `characterBrief.headline is ${[...headline].length} characters; aim for 70 or fewer.`, "canvas.characterBrief.headline"));
  }
  if ([...introduction].length > 220) {
    warnings.push(issue("LONG_INTRODUCTION", `characterBrief.introduction is ${[...introduction].length} characters; aim for 220 or fewer.`, "canvas.characterBrief.introduction"));
  }
}

/**
 * Run deterministic checks only. Wording heuristics are warnings and never decide truth.
 */
export function auditCaseDocuments({ canvas, ledger, verification }) {
  const errors = [];
  const warnings = [];

  if (!record(canvas)) errors.push(issue("INVALID_CANVAS", "Canvas root must be an object.", "canvas"));
  if (!record(ledger)) errors.push(issue("INVALID_LEDGER", "Claim ledger root must be an object.", "ledger"));
  if (!record(verification)) errors.push(issue("INVALID_VERIFICATION", "Verification report root must be an object.", "verification"));
  if (errors.length > 0) return { errors, warnings, stats: { claims: 0, targets: 0, verdicts: 0 } };

  for (const [label, document] of [["canvas", canvas], ["ledger", ledger], ["verification", verification]]) {
    walkStrings(document, (value, location) => {
      if (PLACEHOLDER_RE.test(value)) {
        errors.push(issue("PLACEHOLDER", `${label} contains unfinished placeholder text.`, `${label}${location.slice(1)}`));
      }
      if (value.trim().toLowerCase() === "unverified") {
        errors.push(issue("UNVERIFIED_VALUE", `${label} contains an unverified value.`, `${label}${location.slice(1)}`));
      }
    });
  }

  validateCaseIds(canvas, ledger, verification, errors);
  validateScope(ledger, canvas, errors);
  const scopeById = validateSourceScopes(ledger, errors);
  const evidenceById = validateEvidence(ledger, scopeById, errors);
  const visualById = validateVisualReferences(ledger, scopeById, errors);
  const canvasEvidenceById = validateCanvasEvidenceProjection(canvas, evidenceById, errors);
  const views = validateCanvasReferences(canvas, scopeById, canvasEvidenceById, visualById, errors);
  const targets = collectClaimTargets(canvas, errors);
  if (targets.size === 0) errors.push(issue("NO_DISPLAY_TARGETS", "Canvas has no claim-bearing display targets."));
  const { claimsById, targetClaims } = validateClaims(ledger, evidenceById, canvasEvidenceById, scopeById, targets, errors, warnings);
  validateDisplayEvidenceLabels(canvas, targets, claimsById, targetClaims, errors);
  validateViewCharters(views, ledger, errors, warnings);
  validateVerification(ledger, verification, claimsById, evidenceById, targetClaims, targets, errors, warnings);
  semanticWarnings(canvas, targets, warnings);

  return {
    errors,
    warnings,
    stats: {
      claims: claimsById.size,
      targets: targets.size,
      verdicts: list(verification.claims).length,
      views: list(canvas.views).length,
    },
  };
}

export function formatAuditReport(result) {
  const lines = [];
  for (const error of result.errors) {
    lines.push(`ERROR [${error.code}]${error.location ? ` ${error.location}` : ""}: ${error.message}`);
  }
  for (const warning of result.warnings) {
    lines.push(`WARN  [${warning.code}]${warning.location ? ` ${warning.location}` : ""}: ${warning.message}`);
  }
  const stats = result.stats ?? {};
  if (result.errors.length === 0) {
    lines.push(`Case audit passed (${stats.claims ?? 0} claims, ${stats.targets ?? 0} display targets, ${stats.views ?? 0} views).`);
  } else {
    lines.push(`Case audit failed (${result.errors.length} errors, ${result.warnings.length} warnings).`);
  }
  return `${lines.join("\n")}\n`;
}

function option(name) {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith("--")) throw new Error(`Missing required option ${name}.`);
  return path.resolve(value);
}

async function readJson(file, label) {
  let raw;
  try {
    raw = await readFile(file, "utf8");
  } catch (error) {
    throw new Error(`Cannot read ${label} ${file}: ${error.message}`);
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Cannot parse ${label} ${file}: ${error.message}`);
  }
}

async function main() {
  const input = option("--input");
  const ledgerFile = option("--ledger");
  const verificationFile = option("--verification");
  const [canvas, ledger, verification] = await Promise.all([
    readJson(input, "canvas"),
    readJson(ledgerFile, "claim ledger"),
    readJson(verificationFile, "verification report"),
  ]);
  const result = auditCaseDocuments({ canvas, ledger, verification });
  process.stdout.write(formatAuditReport(result));
  if (result.errors.length > 0) process.exitCode = 1;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
