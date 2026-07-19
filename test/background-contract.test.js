import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readSource(path) {
  try {
    return await readFile(new URL(path, import.meta.url), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return "";
    }

    throw error;
  }
}

test("handles only the approved direct-copy command in its window", async () => {
  const script = await readSource("../src/background.js");

  assert.match(script, /const COMMAND_NAME = "copy-selected-tab-urls"/);
  assert.match(script, /if \(command !== COMMAND_NAME\)/);
  assert.match(script, /const query = \{\s*highlighted:\s*true\s*\}/);
  assert.match(script, /query\.windowId = windowId/);
  assert.match(script, /query\.lastFocusedWindow = true/);
  assert.match(script, /chrome\.tabs\.query\(query\)/);
});

test("serializes offscreen clipboard creation and skips it for no URLs", async () => {
  const script = await readSource("../src/background.js");

  assert.match(script, /let creatingOffscreenDocument/);
  assert.match(script, /if \(creatingOffscreenDocument\)/);
  assert.match(script, /if \(!payload\) \{\s*return 0;/);
  assert.match(script, /reasons:\s*\[\s*"CLIPBOARD"\s*\]/);
  assert.match(script, /chrome\.offscreen\.createDocument/);
});

test("targets the offscreen document and requires an explicit result", async () => {
  const background = await readSource("../src/background.js");
  const offscreen = await readSource("../src/offscreen.js");
  const html = await readSource("../src/offscreen.html");

  assert.match(
    background,
    /chrome\.runtime\.sendMessage\(\{\s*target:\s*"offscreen"/,
  );
  assert.match(background, /if \(!response\?\.ok\)/);
  assert.match(offscreen, /message\.target !== "offscreen"/);
  assert.match(offscreen, /clipboardBuffer\.value = message\.text/);
  assert.match(offscreen, /clipboardBuffer\.select\(\)/);
  assert.match(offscreen, /document\.execCommand\("copy"\)/);
  assert.doesNotMatch(offscreen, /navigator\.clipboard\.writeText/);
  assert.match(offscreen, /sendResponse\(\{\s*ok:\s*true\s*\}\)/);
  assert.match(html, /<textarea[^>]+id="clipboard-buffer"/);
  assert.match(html, /<script[^>]+type="module"[^>]+src="offscreen\.js"/);
});

test("shows count, zero, or error feedback and clears the badge", async () => {
  const script = await readSource("../src/background.js");

  assert.match(script, /showBadge\(String\(count\)\)/);
  assert.match(script, /showBadge\("!"\)/);
  assert.match(script, /setBadgeText\(\{\s*text\s*\}\)/);
  assert.match(script, /setTimeout\(/);
  assert.match(script, /setBadgeText\(\{\s*text:\s*""\s*\}\)/);
});
