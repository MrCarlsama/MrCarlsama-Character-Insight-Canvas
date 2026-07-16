#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function requiredOption(name) {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith("--")) throw new Error(`Missing required option ${name}.`);
  return value;
}

function optionalOption(name) {
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}.`);
  return value;
}

function slug(value) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "character";
}

function siblingPath(canvasPath, suffix) {
  const name = path.basename(canvasPath);
  const stem = name.endsWith(".canvas.json")
    ? name.slice(0, -".canvas.json".length)
    : name.endsWith(".json")
      ? name.slice(0, -".json".length)
      : name;
  return path.join(path.dirname(canvasPath), `${stem}${suffix}`);
}

function replaceTokens(value, tokens) {
  if (typeof value === "string") {
    return Object.entries(tokens).reduce(
      (text, [name, replacement]) => text.replaceAll(`{{${name}}}`, replacement),
      value,
    );
  }
  if (Array.isArray(value)) return value.map((item) => replaceTokens(item, tokens));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, replaceTokens(item, tokens)]),
    );
  }
  return value;
}

async function loadTemplate(templateDir, filename, tokens) {
  const source = await readFile(path.join(templateDir, filename), "utf8");
  return replaceTokens(JSON.parse(source), tokens);
}

async function writeJson(target, value, force) {
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: "utf8",
    flag: force ? "w" : "wx",
  });
}

const character = requiredOption("--character");
const work = requiredOption("--work");
const canvasPath = path.resolve(requiredOption("--output"));
const ledgerPath = path.resolve(
  optionalOption("--ledger") ?? siblingPath(canvasPath, ".claims.json"),
);
const verificationPath = path.resolve(
  optionalOption("--verification") ?? siblingPath(canvasPath, ".verification.json"),
);
const force = process.argv.includes("--force");

const uniqueTargets = new Set([canvasPath, ledgerPath, verificationPath]);
if (uniqueTargets.size !== 3) {
  throw new Error("Canvas, ledger, and verification outputs must use different paths.");
}

if (!force) {
  const existing = [];
  for (const target of uniqueTargets) {
    try {
      await access(target);
      existing.push(target);
    } catch {
      // Missing is the expected state for a new scaffold.
    }
  }
  if (existing.length > 0) {
    throw new Error(`Refusing to overwrite existing file(s): ${existing.join(", ")}. Use --force to replace them.`);
  }
}

const caseId = `${slug(work)}-${slug(character)}`;
const tokens = { CASE_ID: caseId, CHARACTER: character, WORK: work };
const templateDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../templates",
);

const [canvas, ledger, verification] = await Promise.all([
  loadTemplate(templateDir, "canvas.template.json", tokens),
  loadTemplate(templateDir, "claim-ledger.template.json", tokens),
  loadTemplate(templateDir, "verification-report.template.json", tokens),
]);

await Promise.all([
  writeJson(canvasPath, canvas, force),
  writeJson(ledgerPath, ledger, force),
  writeJson(verificationPath, verification, force),
]);

process.stdout.write(
  [
    `Created internal canvas: ${canvasPath}`,
    `Created internal claim ledger: ${ledgerPath}`,
    `Created internal verification report: ${verificationPath}`,
    "These are temporary work files, not the default user deliverables.",
    "All files contain blocking research placeholders by design.",
  ].join("\n") + "\n",
);
