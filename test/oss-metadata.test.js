import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readSource(path) {
  return readFile(new URL(path, import.meta.url), "utf8");
}

test("keeps third-party icon licensing and internal planning metadata out of public source", async () => {
  const [agents, gitignore, notices, apacheLicense, readme] = await Promise.all([
    readSource("../AGENTS.md"),
    readSource("../.gitignore"),
    readSource("../THIRD_PARTY_NOTICES.md"),
    readSource("../LICENSES/Apache-2.0.txt"),
    readSource("../README.md"),
  ]);

  // The evolve loop reads its settings (including notion_task_url) from this
  // block, so it is the only part of AGENTS.md allowed to mention Notion.
  const agentsWithoutEvolveConfig = agents.replace(
    /<!-- @evolve-config[\s\S]*?-->/,
    "",
  );

  assert.doesNotMatch(
    agentsWithoutEvolveConfig,
    /app\.notion\.com|notion_task_url|\.plans\//,
  );
  assert.match(gitignore, /^\.plans\/$/m);
  assert.match(notices, /Google Material Design Icons/);
  assert.match(notices, /Apache-2\.0/);
  assert.match(apacheLicense, /Apache License[\s\S]*Version 2\.0/);
  assert.match(readme, /THIRD_PARTY_NOTICES\.md/);
});
