import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("presents selectable Material icon candidates for the extension", async () => {
  const html = await readFile(
    new URL("../docs/icon-preview.html", import.meta.url),
    "utf8",
  );

  for (const iconName of ["content_copy", "copy_all", "tab", "link"]) {
    assert.match(html, new RegExp(`data-icon="${iconName}"`));
  }

  assert.match(html, /<fieldset/);
  assert.match(html, /type="radio"/);
  assert.match(html, /<input id="copy-all" name="icon" type="radio" checked>/);
  assert.match(
    html,
    /\.material-symbols-rounded\s*\{[\s\S]*color:\s*#5f6368;/,
  );
  assert.match(html, /:focus-visible/);
});
