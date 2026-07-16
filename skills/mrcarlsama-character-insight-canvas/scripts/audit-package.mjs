#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expectedSkillName = "mrcarlsama-character-insight-canvas";
const required = [
  "SKILL.md",
  "references/research-contract.md",
  "references/verification-contract.md",
  "references/chinese-narrative-contract.md",
  "references/content-contract.md",
  "references/renderer-contract.md",
  "references/quality-gates.md",
  "templates/canvas.template.json",
  "templates/claim-ledger.template.json",
  "templates/verification-report.template.json",
  "scripts/scaffold.mjs",
  "scripts/audit-case.mjs",
  "scripts/audit-package.mjs",
  "tests/audit-case.test.mjs",
  "tests/scaffold.test.mjs",
];

const files = new Map();
const errors = [];

for (const relative of required) {
  try {
    files.set(relative, await readFile(path.join(root, relative), "utf8"));
  } catch (error) {
    errors.push(`Missing required file: ${relative} (${error.code ?? "read error"}).`);
  }
}

const skill = files.get("SKILL.md") ?? "";
const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/);
if (!frontmatter) errors.push("SKILL.md is missing YAML frontmatter.");
const header = frontmatter?.[1] ?? "";
const keys = [...header.matchAll(/^([a-z-]+):/gm)].map((match) => match[1]);
if (keys.join(",") !== "name,description") {
  errors.push(`Frontmatter keys must be name,description; received ${keys.join(",") || "none"}.`);
}
const declaredSkillName = header.match(/^name: ([a-z0-9-]+)$/m)?.[1];
if (declaredSkillName !== expectedSkillName) errors.push("Skill name is incorrect.");
if (path.basename(root) !== expectedSkillName) {
  errors.push(`Skill directory must be named ${expectedSkillName}; received ${path.basename(root)}.`);
}
if (!/^description: Use when /m.test(header)) errors.push("Description must start with Use when.");

const semanticContract = [
  ["independent verification", /independent verification/i],
  ["isolated verifier context", /isolated context/i],
  ["claim ledger", /claim ledger/i],
  ["final projection review", /final projection|projection review/i],
  ["Chinese narrative contract", /chinese-narrative-contract\.md/i],
  ["case audit command", /audit-case\.mjs/i],
  ["single HTML handoff", /exactly one self-contained HTML/i],
  ["temporary internal work directory", /task-owned temporary work directory/i],
];

for (const [label, pattern] of semanticContract) {
  if (!pattern.test(skill)) errors.push(`SKILL.md is missing the ${label} gate.`);
}

const viewContract = `${skill}\n${files.get("references/content-contract.md") ?? ""}`;
if (/\b\d+\s*[–-]\s*\d+\s+(?:evidence\s+)?views\b/i.test(viewContract)) {
  errors.push("Evidence-view count must be derived from distinct questions, not a fixed range.");
}

for (const [relative, content] of files) {
  if (/\/Users\/|[A-Za-z]:\\Users\\/.test(content)) {
    errors.push(`${relative} contains an absolute home path.`);
  }
  if (/\bv1\.[12]\b/i.test(content)) {
    errors.push(`${relative} contains a staged minor-version contract; this package uses one complete workflow.`);
  }
}

for (const relative of [
  "templates/canvas.template.json",
  "templates/claim-ledger.template.json",
  "templates/verification-report.template.json",
]) {
  const content = files.get(relative);
  if (!content) continue;
  try {
    JSON.parse(content);
  } catch (error) {
    errors.push(`${relative} is invalid JSON: ${error.message}`);
  }
}

const scaffold = files.get("scripts/scaffold.mjs") ?? "";
if (!/claim-ledger\.template\.json/.test(scaffold) || !/verification-report\.template\.json/.test(scaffold)) {
  errors.push("scaffold.mjs must create the claim ledger and verification report from package templates.");
}

for (const match of skill.matchAll(/\]\(([^)]+)\)/g)) {
  const target = match[1];
  if (/^[a-z]+:/i.test(target) || target.startsWith("#")) continue;
  try {
    await access(path.resolve(root, target));
  } catch {
    errors.push(`SKILL.md links to a missing local file: ${target}.`);
  }
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Skill package audit passed (${required.length} files).\n`);
}
