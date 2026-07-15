#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

function option(name) {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith("--")) throw new Error(`Missing required option ${name}.`);
  return value;
}

function slug(value) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "") || "character";
}

const character = option("--character");
const work = option("--work");
const output = path.resolve(option("--output"));
const id = `${slug(work)}-${slug(character)}`;

const document = {
  schemaVersion: "1.0",
  metadata: {
    id,
    title: `《${work}》${character} · 角色洞察画板`,
    language: "zh-CN",
    description: "RESEARCH REQUIRED: replace with the exact report scope.",
    subject: character,
  },
  characterBrief: {
    eyebrow: "CHARACTER IN 30 SECONDS",
    title: character,
    headline: "RESEARCH REQUIRED",
    introduction: "RESEARCH REQUIRED",
    spoilerNote: "RESEARCH REQUIRED: state the spoiler boundary.",
    sourceScopes: [],
    firstImpression: {
      surface: "RESEARCH REQUIRED",
      reframed: "RESEARCH REQUIRED",
      nodeId: "n-subject",
      evidenceIds: [],
    },
    sections: [],
  },
  evidence: [],
  nodes: [
    {
      id: "n-subject",
      kind: "character",
      title: character,
      summary: "RESEARCH REQUIRED",
      tags: ["中心人物"],
      importance: 10,
      certainty: "confirmed-text",
      evidenceIds: [],
      groupIds: [],
    },
  ],
  edges: [],
  groups: [],
  views: [
    {
      id: "relationships",
      title: "人物关系",
      description: "RESEARCH REQUIRED: state the question this view answers.",
      visibleNodeIds: ["n-subject"],
      visibleEdgeIds: [],
      visibleGroupIds: [],
      placements: {
        nodes: { "n-subject": { x: 0, y: 0, size: 18 } },
        groups: {},
      },
      camera: { x: 0.5, y: 0.5, ratio: 1 },
    },
  ],
};

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(document, null, 2)}\n`, "utf8");
process.stdout.write(`Created ${output}\n`);
