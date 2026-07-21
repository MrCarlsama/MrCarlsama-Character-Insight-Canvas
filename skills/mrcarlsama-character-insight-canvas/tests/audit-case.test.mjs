import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  auditCaseDocuments,
  collectClaimTargets,
} from "../scripts/audit-case.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const auditScript = path.resolve(here, "../scripts/audit-case.mjs");

function claim(id, displayTarget, overrides = {}) {
  return {
    id,
    category: "identity",
    statement: `命题 ${id}`,
    claimType: "fact",
    evidenceClass: "confirmed-text",
    qualifiers: [],
    attribution: null,
    condition: null,
    causalBasis: "none",
    sourceScopeIds: ["scope-main"],
    evidenceIds: ["ev-primary"],
    sceneOrObservableBasis: `材料中的 ${id} 记录`,
    displayTargets: [displayTarget],
    conflicts: [],
    notes: null,
    ...overrides,
  };
}

function validFixture() {
  const canvas = {
    schemaVersion: "1.0",
    metadata: {
      id: "work-character",
      title: "《作品》角色洞察画板",
      language: "zh-CN",
      description: "限定在正文第一卷的角色研究。",
      subject: "角色甲",
    },
    characterBrief: {
      title: "角色甲",
      headline: "她先观察局势，再决定是否开口。",
      introduction: "角色甲是队伍里的记录者。她习惯先核对事实，遇到冲突时会主动追问来源。",
      sourceScopes: [
        {
          id: "scope-main",
          title: "正文第一卷",
          medium: "小说",
          scope: "纸书第一版第一卷",
        },
      ],
      firstImpression: {
        surface: "初见时话少，和人保持距离。",
        reframed: "熟悉以后会发现，她沉默时通常在比较不同人的说法。",
      },
      sections: [
        {
          id: "identity",
          title: "她是谁",
          items: [
            {
              id: "identity-primary",
              label: "队伍记录者",
              statement: "她负责整理行动记录，也会当面指出前后矛盾。",
              certainty: "confirmed-text",
              evidenceIds: ["ev-primary"],
              scopeIds: ["scope-main"],
            },
          ],
        },
      ],
    },
    guide: {
      title: "从旁观记录到主动追问",
      summary: "五次选择说明她如何一步步介入队伍的决定。",
      steps: [
        {
          id: "guide-choice",
          title: "从旁观到追问",
          summary: "她不再只做记录，开始要求当事人说明选择。",
          viewId: "development",
          nodeId: "n-one",
        },
        {
          id: "guide-choice-2",
          title: "发现记录互相矛盾",
          summary: "她开始把不同人的说法放在一起核对。",
          viewId: "development",
          nodeId: "n-one",
        },
        {
          id: "guide-choice-3",
          title: "第一次当面追问",
          summary: "她不再把矛盾只留在纸面上。",
          viewId: "development",
          nodeId: "n-two",
        },
        {
          id: "guide-choice-4",
          title: "承担追问带来的冲突",
          summary: "合作关系因此转为互相核对。",
          viewId: "development",
          nodeId: "n-two",
        },
        {
          id: "guide-choice-5",
          title: "参与下一次决定",
          summary: "她从记录结果的人变成了参与判断的人。",
          viewId: "development",
          nodeId: "n-one",
        },
      ],
    },
    evidence: [
      { id: "ev-primary", label: "正文第一卷", url: "https://example.test/primary", sourceType: "supplied-primary" },
      { id: "ev-secondary-a", label: "资料甲", url: "https://example.test/a", sourceType: "secondary-reconstruction" },
      { id: "ev-secondary-b", label: "资料乙", url: "https://example.test/b", sourceType: "secondary-reconstruction" },
    ],
    nodes: [
      {
        id: "n-one",
        title: "角色甲",
        summary: "她先记录分歧，再向当事人追问。",
        body: "这让她从被动记录者变成了会影响决定的人。",
        certainty: "interpretation",
      },
      {
        id: "n-two",
        title: "角色乙",
        summary: "角色乙的隐瞒促使她改变做法。",
        certainty: "confirmed-text",
      },
    ],
    edges: [
      {
        id: "e-one-two",
        source: "n-one",
        target: "n-two",
        label: "隐瞒后互相核对",
        summary: "一次隐瞒使两人的合作转为互相核对。",
        certainty: "confirmed-text",
      },
    ],
    groups: [],
    views: [
      {
        id: "development",
        title: "做法怎么变",
        visibleNodeIds: ["n-one", "n-two"],
        visibleEdgeIds: ["e-one-two"],
        visibleGroupIds: [],
      },
    ],
  };

  const ledger = {
    schemaVersion: "1.0",
    caseId: "work-character",
    scope: {
      character: "角色甲",
      work: "作品",
      researchMode: "supplied",
      medium: "小说",
      versionOrAdaptation: "纸书第一版",
      sourceBoundary: "正文第一卷",
      spoilerCeiling: "第一卷结尾",
      outputLanguage: "zh-CN",
    },
    sourceScopes: [
      {
        id: "scope-main",
        title: "正文第一卷",
        work: "作品",
        medium: "小说",
        version: "纸书第一版",
        installmentRange: "第一卷",
      },
    ],
    evidence: [
      {
        id: "ev-primary",
        title: "正文第一卷",
        urlOrLocation: "/supplied/volume-1.txt",
        sourceTier: 1,
        sourceClass: "supplied-primary",
        originGroup: "novel-volume-1",
        sourceScopeIds: ["scope-main"],
        locator: "第一至八章",
      },
      {
        id: "ev-secondary-a",
        title: "资料甲",
        urlOrLocation: "https://example.test/a",
        sourceTier: 3,
        sourceClass: "secondary-reconstruction",
        originGroup: "reference-a",
        sourceScopeIds: ["scope-main"],
        locator: "角色条目",
        accessedAt: "2026-07-14",
      },
      {
        id: "ev-secondary-b",
        title: "资料乙",
        urlOrLocation: "https://example.test/b",
        sourceTier: 3,
        sourceClass: "secondary-reconstruction",
        originGroup: "reference-b",
        sourceScopeIds: ["scope-main"],
        locator: "第一卷梗概",
        accessedAt: "2026-07-14",
      },
    ],
    viewCharters: [
      {
        viewId: "development",
        question: "角色甲处理冲突的做法怎样改变？",
        inScope: ["与选择变化直接相关的行动"],
        outOfScope: ["与角色甲无关的世界设定"],
        whyThisViewExists: "单看人物关系无法说明她何时开始主动追问。",
      },
    ],
    visualReferences: [],
    claims: [
      claim("c-headline", "characterBrief.headline"),
      claim("c-introduction", "characterBrief.introduction"),
      claim("c-surface", "characterBrief.firstImpression.surface", { claimType: "visual-observation", evidenceClass: "visual-observation" }),
      claim("c-reframed", "characterBrief.firstImpression.reframed", { claimType: "interpretation", evidenceClass: "interpretation" }),
      claim("c-section", "characterBrief.sections.identity.identity-primary"),
      claim("c-guide-title", "guide.title", { claimType: "interpretation", evidenceClass: "interpretation" }),
      claim("c-guide-summary", "guide.summary", { claimType: "interpretation", evidenceClass: "interpretation" }),
      claim("c-guide", "guide.steps.guide-choice"),
      claim("c-guide-2", "guide.steps.guide-choice-2"),
      claim("c-guide-3", "guide.steps.guide-choice-3"),
      claim("c-guide-4", "guide.steps.guide-choice-4"),
      claim("c-guide-5", "guide.steps.guide-choice-5"),
      claim("c-node-title", "nodes.n-one.title"),
      claim("c-node-summary", "nodes.n-one.summary"),
      claim("c-node-body", "nodes.n-one.body", { claimType: "interpretation", evidenceClass: "interpretation", causalBasis: "inferred" }),
      claim("c-node-two-title", "nodes.n-two.title"),
      claim("c-node-two", "nodes.n-two.summary"),
      claim("c-edge-label", "edges.e-one-two.label", { qualifiers: ["conditional"], condition: "按正文第一卷呈现", causalBasis: "explicit" }),
      claim("c-edge", "edges.e-one-two.summary", { qualifiers: ["conditional"], condition: "按正文第一卷呈现", causalBasis: "explicit" }),
    ],
  };

  const verification = {
    schemaVersion: "1.0",
    caseId: "work-character",
    metadata: {
      status: "passed",
      verifierRunId: "independent-run-001",
      independentSubagent: true,
      isolatedContext: true,
      sourceReviewPerformed: true,
      publicWebSearchPerformed: false,
      verifiedAt: "2026-07-15T08:00:00.000Z",
    },
    claims: ledger.claims.map((item) => ({
      claimId: item.id,
      verdict: item.claimType === "interpretation" ? "interpretation-reasonable" : "confirmed",
      checkedEvidenceIds: item.evidenceIds,
      independentOriginGroups: ["novel-volume-1"],
      requiredQualifiers: [],
      notes: "独立复核材料后得到此结论。",
      suggestedCorrection: null,
    })),
    projectionReview: {
      status: "passed",
      verifierRunId: "independent-run-001",
      reviewedTargets: [...collectClaimTargets(canvas).keys()],
      findings: [],
      reviewedAt: "2026-07-15T09:00:00.000Z",
    },
  };

  return { canvas, ledger, verification };
}

function addVerifiedClaim(fixture, id, displayTarget, overrides = {}) {
  const item = claim(id, displayTarget, overrides);
  fixture.ledger.claims.push(item);
  fixture.verification.claims.push({
    claimId: item.id,
    verdict: item.claimType === "interpretation" ? "interpretation-reasonable" : "confirmed",
    checkedEvidenceIds: item.evidenceIds,
    independentOriginGroups: ["novel-volume-1"],
    requiredQualifiers: [],
    notes: "独立复核材料后得到此结论。",
    suggestedCorrection: null,
  });
}

function anchoredFixture() {
  const fixture = validFixture();
  fixture.canvas.metadata.evidenceMode = "anchored";
  fixture.canvas.nodes[0].evidenceIds = ["ev-primary"];
  fixture.canvas.nodes[1].evidenceIds = ["ev-primary"];
  fixture.canvas.edges[0].evidenceIds = ["ev-primary"];
  fixture.canvas.evidence[0].anchors = [
    {
      id: "anchor-nodes",
      targetIds: ["n-one", "n-two"],
      locator: "第一章，第 12 段",
      excerpt: "她先把两份记录并排放好，再请两人逐项说明。",
      speaker: "叙述者",
      context: "队伍核对行动记录时",
      supports: "两名角色节点都以这次当面核对为文本依据。",
    },
    {
      id: "anchor-edge",
      targetIds: ["e-one-two"],
      locator: "第二章，第 4 场",
      observation: "两人之后会交换记录，并当场确认不一致之处。",
      supports: "关系边的互相核对来自后续可观察行为。",
    },
  ];
  addVerifiedClaim(
    fixture,
    "c-anchor-nodes",
    "evidence.ev-primary.anchors.anchor-nodes.supports",
  );
  addVerifiedClaim(
    fixture,
    "c-anchor-edge",
    "evidence.ev-primary.anchors.anchor-edge.supports",
  );
  fixture.verification.projectionReview.reviewedTargets = [...collectClaimTargets(fixture.canvas).keys()];
  return fixture;
}

function continuityFixture() {
  const fixture = validFixture();
  fixture.ledger.sourceScopes.push({
    id: "scope-revised",
    title: "修订后正文第一卷",
    work: "作品",
    medium: "小说",
    version: "纸书修订版",
    installmentRange: "第一卷",
  });
  fixture.canvas.characterBrief.sourceScopes.push({
    id: "scope-revised",
    title: "修订后正文第一卷",
    medium: "小说",
    scope: "纸书修订版第一卷",
  });
  fixture.ledger.evidence.find((item) => item.id === "ev-secondary-a").sourceScopeIds = ["scope-revised"];
  fixture.ledger.continuityRelations = [
    {
      id: "continuity-script-update",
      relationType: "script-revision",
      status: "confirmed",
      baseScopeIds: ["scope-main"],
      variantScopeIds: ["scope-revised"],
      summary: "修订版替换了旧版台词，角色是否知情的文本结论随之改变。",
      evidenceIds: ["ev-primary", "ev-secondary-a"],
    },
  ];
  fixture.canvas.characterBrief.continuityNotes = [
    {
      id: "continuity-script-update",
      label: "脚本修订",
      relationType: "script-revision",
      status: "confirmed",
      summary: "修订版替换了旧版台词，角色是否知情的文本结论随之改变。",
      scopeIds: ["scope-main", "scope-revised"],
      evidenceIds: ["ev-primary", "ev-secondary-a"],
      certainty: "confirmed-text",
    },
  ];
  fixture.verification.metadata.continuityReviewPerformed = true;
  addVerifiedClaim(
    fixture,
    "c-continuity-script-update",
    "characterBrief.continuityNotes.continuity-script-update",
  );
  fixture.verification.projectionReview.reviewedTargets = [...collectClaimTargets(fixture.canvas).keys()];
  return fixture;
}

function codes(issues) {
  return new Set(issues.map((item) => item.code));
}

test("legacy documents without anchors still pass deterministic gates", () => {
  const result = auditCaseDocuments(validFixture());
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
  assert.equal(result.stats.claims, 19);
  assert.equal(result.stats.targets, 19);
});

test("region-aware cases accept a Mainland China primary scope without breaking legacy ledgers", () => {
  const fixture = validFixture();
  fixture.ledger.scope.regionalSourcePolicy = {
    mode: "cn-primary",
    primaryRegion: "mainland-china",
    primaryLanguage: "zh-CN",
    supplementaryUse: "differences-only",
  };
  Object.assign(fixture.ledger.sourceScopes[0], {
    region: "mainland-china",
    language: "zh-CN",
    sourceRole: "primary",
    differenceFromPrimary: null,
  });
  fixture.verification.metadata.regionalScopeReviewPerformed = true;

  const result = auditCaseDocuments(fixture);
  assert.deepEqual(result.errors, []);
});

test("region-aware cases reject mismatched primary scopes and unjustified foreign supplements", () => {
  const fixture = validFixture();
  fixture.ledger.scope.regionalSourcePolicy = {
    mode: "cn-primary",
    primaryRegion: "mainland-china",
    primaryLanguage: "zh-CN",
    supplementaryUse: "differences-only",
  };
  Object.assign(fixture.ledger.sourceScopes[0], {
    region: "global",
    language: "en-US",
    sourceRole: "primary",
    differenceFromPrimary: null,
  });
  fixture.ledger.sourceScopes.push({
    id: "scope-global",
    title: "Global release",
    work: "作品",
    medium: "小说",
    version: "Global edition",
    installmentRange: "Volume 1",
    region: "global",
    language: "en-US",
    sourceRole: "supplementary",
    differenceFromPrimary: null,
  });
  fixture.verification.metadata.regionalScopeReviewPerformed = false;

  const result = auditCaseDocuments(fixture);
  const errorCodes = codes(result.errors);
  assert(errorCodes.has("PRIMARY_REGION_MISMATCH"));
  assert(errorCodes.has("UNJUSTIFIED_SUPPLEMENTARY_SCOPE"));
  assert(errorCodes.has("NO_REGIONAL_SCOPE_REVIEW"));
});

test("material script revisions are evidence-bound and visibly marked in the character brief", () => {
  const result = auditCaseDocuments(continuityFixture());
  assert.deepEqual(result.errors, []);
  assert.equal(result.stats.targets, 20);
});

test("unverified retcon labels, hidden continuity changes, and skipped review fail", () => {
  const fixture = continuityFixture();
  fixture.ledger.continuityRelations[0].relationType = "retcon";
  fixture.ledger.continuityRelations[0].status = "disputed";
  fixture.canvas.characterBrief.continuityNotes = [];
  fixture.verification.metadata.continuityReviewPerformed = false;

  const result = auditCaseDocuments(fixture);
  const errorCodes = codes(result.errors);
  assert(errorCodes.has("UNCONFIRMED_RETCON"));
  assert(errorCodes.has("MISSING_CONTINUITY_NOTE"));
  assert(errorCodes.has("NO_CONTINUITY_REVIEW"));
});

test("unresolved contradictions cannot masquerade as resolved retcons or vague Chinese labels", () => {
  const fixture = continuityFixture();
  fixture.ledger.continuityRelations[0].relationType = "contradiction-unresolved";
  fixture.ledger.continuityRelations[0].status = "confirmed";
  Object.assign(fixture.canvas.characterBrief.continuityNotes[0], {
    label: "疑似吃书",
    relationType: "contradiction-unresolved",
    status: "confirmed",
  });

  const result = auditCaseDocuments(fixture);
  const errorCodes = codes(result.errors);
  assert(errorCodes.has("FALSELY_RESOLVED_CONTRADICTION"));
  assert(errorCodes.has("CONTINUITY_LABEL_MISMATCH"));
});

test("global evidence anchors become claim targets and valid node/edge pairs pass in anchored mode", () => {
  const fixture = anchoredFixture();
  const targets = collectClaimTargets(fixture.canvas);

  assert.equal(
    targets.get("evidence.ev-primary.anchors.anchor-nodes.supports"),
    "两名角色节点都以这次当面核对为文本依据。",
  );
  assert.equal(
    targets.get("evidence.ev-primary.anchors.anchor-edge.supports"),
    "关系边的互相核对来自后续可观察行为。",
  );

  const result = auditCaseDocuments(fixture);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
  assert.equal(result.stats.claims, 21);
  assert.equal(result.stats.targets, 21);
});

test("anchor ids, fields, target references, and entity evidence links are validated", () => {
  const fixture = validFixture();
  fixture.canvas.evidence[0].anchors = [
    {
      id: "duplicate-anchor",
      targetIds: [],
      locator: "",
      excerpt: "正文摘录",
      observation: "不能和摘录同时出现",
      speaker: "",
      context: "",
      supports: "",
    },
    {
      id: "unknown-target",
      targetIds: ["missing-entity", 42],
      locator: "第一章",
      excerpt: "正文摘录",
      supports: "这条锚点指向不存在的实体。",
    },
    {
      targetIds: ["n-one"],
      locator: "第一章",
      excerpt: "正文摘录",
      supports: "缺少稳定锚点 id。",
    },
  ];
  fixture.canvas.evidence[1].anchors = [
    {
      id: "duplicate-anchor",
      targetIds: ["n-one"],
      locator: "资料甲角色条目",
      observation: "资料页把角色列为记录者。",
      supports: "这条锚点使用了实体没有引用的证据。",
    },
  ];

  const result = auditCaseDocuments(fixture);
  const errorCodes = codes(result.errors);
  assert(errorCodes.has("MISSING_ANCHOR_ID"));
  assert(errorCodes.has("DUPLICATE_ANCHOR_ID"));
  assert(errorCodes.has("MISSING_ANCHOR_TARGETS"));
  assert(errorCodes.has("INVALID_ANCHOR_TARGET_ID"));
  assert(errorCodes.has("UNKNOWN_ANCHOR_TARGET"));
  assert(errorCodes.has("INVALID_ANCHOR_BASIS"));
  assert(errorCodes.has("EMPTY_ANCHOR_OPTIONAL_FIELD"));
  assert(errorCodes.has("ANCHOR_EVIDENCE_MISMATCH"));
  assert(result.errors.some((item) => item.code === "REQUIRED_FIELD" && item.location?.endsWith(".locator")));
  assert(result.errors.some((item) => item.code === "REQUIRED_FIELD" && item.location?.endsWith(".supports")));
});

test("anchored mode requires every node and evidence pairing to have a target anchor", () => {
  const fixture = anchoredFixture();
  fixture.canvas.evidence[0].anchors[0].targetIds = ["n-one"];

  const result = auditCaseDocuments(fixture);
  assert(codes(result.errors).has("MISSING_TARGET_ANCHOR"));
  assert(result.errors.some((item) => item.message.includes("Node n-two references evidence ev-primary")));
});

test("anchored mode requires every edge and evidence pairing to have a target anchor", () => {
  const fixture = anchoredFixture();
  fixture.canvas.evidence[0].anchors[1].targetIds = ["n-one"];

  const result = auditCaseDocuments(fixture);
  const missingAnchorErrors = result.errors.filter((item) => item.code === "MISSING_TARGET_ANCHOR");
  assert(missingAnchorErrors.some((item) => item.message.includes("Edge e-one-two references evidence ev-primary")));
  assert.equal(missingAnchorErrors.some((item) => item.message.startsWith("Node ")), false);
});

test("broken canvas references, short paths, and claim-label mismatches fail", () => {
  const fixture = validFixture();
  fixture.canvas.guide.steps = fixture.canvas.guide.steps.slice(0, 4);
  fixture.canvas.edges[0].target = "n-missing";
  fixture.canvas.characterBrief.sections[0].items[0].evidenceIds = ["ev-missing"];
  fixture.canvas.nodes[0].certainty = "confirmed-text";
  fixture.ledger.claims.find((item) => item.id === "c-reframed").evidenceClass = "confirmed-text";

  const result = auditCaseDocuments(fixture);
  const errorCodes = codes(result.errors);
  assert(errorCodes.has("INVALID_CORE_PATH_LENGTH"));
  assert(errorCodes.has("UNKNOWN_NODE"));
  assert(errorCodes.has("UNKNOWN_CANVAS_EVIDENCE"));
  assert(errorCodes.has("CLAIM_EVIDENCE_MISMATCH"));
  assert(errorCodes.has("DISPLAY_EVIDENCE_MISMATCH"));
});

test("unfinished, unmapped, and blocked displayed claims fail", () => {
  const fixture = validFixture();
  fixture.canvas.characterBrief.headline = "TODO：这是唯一答案。";
  fixture.canvas.nodes[0].certainty = "unverified";
  fixture.ledger.claims.find((item) => item.id === "c-headline").displayTargets = [];
  fixture.verification.claims.find((item) => item.claimId === "c-introduction").verdict = "contradicted";

  const result = auditCaseDocuments(fixture);
  const errorCodes = codes(result.errors);
  assert(errorCodes.has("PLACEHOLDER"));
  assert(errorCodes.has("UNVERIFIED_VALUE"));
  assert(errorCodes.has("UNMAPPED_DISPLAY_TARGET"));
  assert(errorCodes.has("BLOCKED_DISPLAY_CLAIM"));
});

test("cross-checks use independent origins and verifier qualifiers survive", () => {
  const fixture = validFixture();
  const targetClaim = fixture.ledger.claims.find((item) => item.id === "c-introduction");
  targetClaim.claimType = "secondary-reconstruction";
  targetClaim.evidenceClass = "cross-checked-secondary";
  targetClaim.evidenceIds = ["ev-secondary-a", "ev-secondary-b"];
  fixture.ledger.evidence.find((item) => item.id === "ev-secondary-b").originGroup = "reference-a";

  const verdict = fixture.verification.claims.find((item) => item.claimId === "c-introduction");
  verdict.verdict = "partially-confirmed";
  verdict.requiredQualifiers = ["attributed"];
  verdict.checkedEvidenceIds = ["ev-secondary-a", "ev-secondary-b"];
  verdict.independentOriginGroups = ["reference-a"];

  const result = auditCaseDocuments(fixture);
  const errorCodes = codes(result.errors);
  assert(errorCodes.has("NOT_INDEPENDENTLY_CROSS_CHECKED"));
  assert(errorCodes.has("DROPPED_REQUIRED_QUALIFIER"));
});

test("projection review covers every displayed target and closes P0/P1 drift", () => {
  const fixture = validFixture();
  fixture.verification.projectionReview.reviewedTargets = fixture.verification.projectionReview.reviewedTargets.slice(1);
  fixture.verification.projectionReview.verifierRunId = "producer-self-check";
  fixture.verification.projectionReview.findings = [
    { severity: "P1", status: "open", target: "characterBrief.headline", note: "条件被删掉。" },
  ];

  const result = auditCaseDocuments(fixture);
  const errorCodes = codes(result.errors);
  assert(errorCodes.has("UNREVIEWED_DISPLAY_TARGET"));
  assert(errorCodes.has("OPEN_HIGH_PRIORITY_DRIFT"));
  assert(errorCodes.has("PROJECTION_VERIFIER_MISMATCH"));
});

test("public evidence and verifier provenance cannot be asserted without records", () => {
  const fixture = validFixture();
  fixture.ledger.scope.researchMode = "public";
  fixture.verification.metadata.publicWebSearchPerformed = false;
  delete fixture.ledger.evidence.find((item) => item.id === "ev-secondary-a").accessedAt;
  const verdict = fixture.verification.claims.find((item) => item.claimId === "c-headline");
  verdict.checkedEvidenceIds = ["ev-secondary-a"];
  verdict.independentOriginGroups = ["made-up-origin"];

  const result = auditCaseDocuments(fixture);
  const errorCodes = codes(result.errors);
  assert(errorCodes.has("MISSING_ACCESS_DATE"));
  assert(errorCodes.has("NO_INDEPENDENT_WEB_SEARCH"));
  assert(errorCodes.has("ORIGIN_EVIDENCE_MISMATCH"));
  assert(errorCodes.has("UNCHECKED_CLAIM_EVIDENCE"));
});

test("strong wording, translated formulas, long copy, and duplicate views only warn", () => {
  const fixture = validFixture();
  fixture.canvas.characterBrief.headline = "这意味着她必定改变所有人的选择。";
  fixture.canvas.characterBrief.introduction = "她会先看清发生了什么，再开口问当事人。".repeat(15);
  fixture.canvas.views.push({
    id: "relationships",
    title: "谁影响她",
    visibleNodeIds: ["n-one", "n-two"],
    visibleEdgeIds: ["e-one-two"],
    visibleGroupIds: [],
  });
  fixture.ledger.viewCharters.push({
    viewId: "relationships",
    question: "哪些人影响她的选择？",
    inScope: ["直接互动"],
    outOfScope: ["无关人物"],
    whyThisViewExists: "把关系影响与做法变化分开。",
  });

  const result = auditCaseDocuments(fixture);
  assert.deepEqual(result.errors, []);
  const warningCodes = codes(result.warnings);
  assert(warningCodes.has("STRONG_WORDING"));
  assert(warningCodes.has("TRANSLATIONESE"));
  assert(warningCodes.has("LONG_INTRODUCTION"));
  assert(warningCodes.has("VIEW_OVERLAP"));
});

test("CLI returns zero for a passing fixture", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "character-insight-audit-"));
  try {
    const fixture = validFixture();
    const canvasPath = path.join(directory, "case.canvas.json");
    const ledgerPath = path.join(directory, "case.claims.json");
    const verificationPath = path.join(directory, "case.verification.json");
    await Promise.all([
      writeFile(canvasPath, JSON.stringify(fixture.canvas), "utf8"),
      writeFile(ledgerPath, JSON.stringify(fixture.ledger), "utf8"),
      writeFile(verificationPath, JSON.stringify(fixture.verification), "utf8"),
    ]);

    const run = spawnSync(process.execPath, [
      auditScript,
      "--input", canvasPath,
      "--ledger", ledgerPath,
      "--verification", verificationPath,
    ], { encoding: "utf8" });

    assert.equal(run.status, 0, run.stderr || run.stdout);
    assert.match(run.stdout, /Case audit passed/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
