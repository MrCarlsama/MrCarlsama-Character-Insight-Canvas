import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const scaffold = path.resolve(here, "../scripts/scaffold.mjs");

function run(args) {
  return spawnSync(process.execPath, [scaffold, ...args], { encoding: "utf8" });
}

test("scaffold preserves Unicode ids, creates three internal work files, and refuses accidental overwrite", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "mrcarlsama-character-insight-scaffold-"));
  const canvasPath = path.join(directory, "case.canvas.json");
  const args = [
    "--character", "ホルハイヤ",
    "--work", "アークナイツ",
    "--output", canvasPath,
  ];

  try {
    const created = run(args);
    assert.equal(created.status, 0, created.stderr || created.stdout);

    const [canvas, ledger, verification] = await Promise.all([
      readFile(canvasPath, "utf8").then(JSON.parse),
      readFile(path.join(directory, "case.claims.json"), "utf8").then(JSON.parse),
      readFile(path.join(directory, "case.verification.json"), "utf8").then(JSON.parse),
    ]);
    assert.equal(canvas.metadata.id, "アークナイツ-ホルハイヤ");
    assert.equal(ledger.caseId, canvas.metadata.id);
    assert.equal(verification.caseId, canvas.metadata.id);

    const refused = run(args);
    assert.notEqual(refused.status, 0);
    assert.match(refused.stderr, /Refusing to overwrite/);

    const replaced = run([...args, "--force"]);
    assert.equal(replaced.status, 0, replaced.stderr || replaced.stdout);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
