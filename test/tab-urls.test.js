import assert from "node:assert/strict";
import test from "node:test";

async function loadTabUrls() {
  try {
    return await import("../src/tab-urls.js");
  } catch (error) {
    if (error.code === "ERR_MODULE_NOT_FOUND") {
      return {};
    }

    throw error;
  }
}

test("keeps a single tab URL unchanged", async () => {
  const { formatTabUrls } = await loadTabUrls();

  assert.equal(typeof formatTabUrls, "function");
  assert.equal(
    formatTabUrls([{ index: 3, url: "https://example.com/one" }]),
    "https://example.com/one",
  );
});

test("orders tabs by their tab-strip index", async () => {
  const { getCopyableTabs } = await loadTabUrls();
  const tabs = [
    { index: 8, title: "Third", url: "https://example.com/three" },
    { index: 2, title: "First", url: "https://example.com/one" },
    { index: 5, title: "Second", url: "https://example.com/two" },
  ];

  assert.equal(typeof getCopyableTabs, "function");
  assert.deepEqual(
    getCopyableTabs(tabs).map(({ title }) => title),
    ["First", "Second", "Third"],
  );
});

test("omits only tabs with absent or empty URLs", async () => {
  const { getCopyableTabs } = await loadTabUrls();
  const tabs = [
    { index: 0, url: "https://example.com" },
    { index: 1 },
    { index: 2, url: "" },
    { index: 3, url: " " },
  ];

  assert.equal(typeof getCopyableTabs, "function");
  assert.deepEqual(
    getCopyableTabs(tabs).map(({ url }) => url),
    ["https://example.com", " "],
  );
});

test("returns an empty payload for no tabs", async () => {
  const { formatTabUrls } = await loadTabUrls();

  assert.equal(typeof formatTabUrls, "function");
  assert.equal(formatTabUrls([]), "");
});

test("joins URLs with newlines and no trailing newline", async () => {
  const { formatTabUrls } = await loadTabUrls();
  const tabs = [
    { index: 4, url: "https://example.com/two" },
    { index: 1, url: "https://example.com/one" },
  ];

  assert.equal(typeof formatTabUrls, "function");
  assert.equal(
    formatTabUrls(tabs),
    "https://example.com/one\nhttps://example.com/two",
  );
});

test("works when Array.prototype.toSorted is unavailable", async () => {
  const { getCopyableTabs } = await loadTabUrls();
  const originalToSorted = Array.prototype.toSorted;

  Array.prototype.toSorted = undefined;

  try {
    const tabs = [
      { index: 2, url: "https://example.com/two" },
      { index: 1, url: "https://example.com/one" },
    ];

    let copyableTabs;
    assert.doesNotThrow(() => {
      copyableTabs = getCopyableTabs(tabs);
    });
    assert.deepEqual(
      copyableTabs.map(({ url }) => url),
      ["https://example.com/one", "https://example.com/two"],
    );
  } finally {
    Array.prototype.toSorted = originalToSorted;
  }
});
