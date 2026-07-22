import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readManifest() {
  try {
    const contents = await readFile(
      new URL("../manifest.json", import.meta.url),
      "utf8",
    );
    return JSON.parse(contents);
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

test("declares the approved Manifest V3 extension contract", async () => {
  const manifest = await readManifest();

  assert.ok(manifest, "manifest.json should exist");
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.action, {
    default_popup: "src/popup.html",
    default_icon: {
      16: "icons/copy_all-16.png",
      32: "icons/copy_all-32.png",
      48: "icons/copy_all-48.png",
      128: "icons/copy_all-128.png",
    },
  });
  assert.deepEqual(manifest.background, {
    service_worker: "src/background.js",
    type: "module",
  });
  assert.deepEqual(manifest.permissions, [
    "tabs",
    "offscreen",
    "clipboardWrite",
  ]);
  assert.deepEqual(manifest.commands?.["copy-selected-tab-urls"], {
    suggested_key: {
      default: "Ctrl+Shift+L",
      mac: "Command+Shift+L",
    },
    description: "Copy selected tab URLs",
  });
});
