#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "SKILL.md",
  "references/research-contract.md",
  "references/content-contract.md",
  "references/renderer-contract.md",
  "references/quality-gates.md",
  "scripts/scaffold.mjs",
  "scripts/audit-package.mjs",
];

const files = new Map();
for (const relative of required) {
  files.set(relative, await readFile(path.join(root, relative), "utf8"));
}

const errors = [];
const skill = files.get("SKILL.md") ?? "";
const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/);
if (!frontmatter) errors.push("SKILL.md is missing YAML frontmatter.");
const header = frontmatter?.[1] ?? "";
const keys = [...header.matchAll(/^([a-z-]+):/gm)].map((match) => match[1]);
if (keys.join(",") !== "name,description") {
  errors.push(`Frontmatter keys must be name,description; received ${keys.join(",") || "none"}.`);
}
if (!/^name: character-insight-canvas$/m.test(header)) errors.push("Skill name is incorrect.");
if (!/^description: Use when /m.test(header)) errors.push("Description must start with Use when.");

const viewContract = `${skill}\n${files.get("references/content-contract.md") ?? ""}`;
if (/\b\d+\s*[–-]\s*\d+\s+(?:evidence\s+)?views\b/i.test(viewContract)) {
  errors.push("Evidence-view count must be derived from distinct questions, not a fixed range.");
}

for (const [relative, content] of files) {
  if (/\/Users\/|[A-Za-z]:\\Users\\/.test(content)) {
    errors.push(`${relative} contains an absolute home path.`);
  }
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Skill package audit passed (${required.length} files).\n`);
}
