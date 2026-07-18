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

test("provides the popup preview and accessible copy controls", async () => {
  const html = await readSource("../src/popup.html");

  assert.match(html, /<script[^>]+type="module"[^>]+src="popup\.js"/);
  assert.match(html, /<ul[^>]+id="tab-list"/);
  assert.match(html, /<button[^>]+id="copy-button"[^>]*>[\s\S]*Copy URLs/);
  assert.match(html, /id="status"[^>]+role="status"[^>]+aria-live="polite"/);
});

test("queries highlighted tabs and copies only after a button click", async () => {
  const script = await readSource("../src/popup.js");

  assert.match(
    script,
    /chrome\.tabs\.query\(\{\s*highlighted:\s*true,\s*currentWindow:\s*true,?\s*\}\)/,
  );
  assert.match(script, /copyButton\.addEventListener\("click"/);
  assert.match(script, /navigator\.clipboard\.writeText\(payload\)/);
  assert.doesNotMatch(script, /\.innerHTML\s*=/);
  assert.match(script, /\.textContent\s*=/);
});

test("provides visible keyboard focus styling", async () => {
  const styles = await readSource("../src/popup.css");

  assert.match(styles, /:focus-visible/);
  assert.match(styles, /outline:/);
});
