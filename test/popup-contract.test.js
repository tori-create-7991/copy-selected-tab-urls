import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

let popupTestId = 0;

async function runOpenClick({
  clipboardText,
  fileAccess,
  fileAccessError,
  clipboardReadError,
  activeTabQueryError,
  activeTabMissing = false,
  activeTabIndex = 3,
  pinnedTabCount = 0,
  failedCreateUrls = [],
}) {
  const elements = new Map();
  const createdTabs = [];
  const createRequests = [];
  const queries = [];
  const originalConsoleError = console.error;
  const originalGlobals = new Map(
    ["document", "chrome", "navigator"].map((name) => [
      name,
      Object.getOwnPropertyDescriptor(globalThis, name),
    ]),
  );

  function createElement() {
    return {
      children: [],
      listeners: new Map(),
      addEventListener(type, listener) {
        this.listeners.set(type, listener);
      },
      append(...children) {
        this.children.push(...children);
      },
    };
  }

  for (const selector of ["#tab-list", "#copy-button", "#open-button", "#status"]) {
    elements.set(selector, createElement());
  }

  Object.defineProperty(globalThis, "document", { configurable: true, value: {
    querySelector: (selector) => elements.get(selector),
    createElement,
  } });
  Object.defineProperty(globalThis, "chrome", { configurable: true, value: {
    tabs: {
      async query(query) {
        queries.push(query);
        if (query.highlighted) {
          return [];
        }
        if (activeTabQueryError) {
          throw activeTabQueryError;
        }

        return activeTabMissing ? [] : [{ index: activeTabIndex, windowId: 7 }];
      },
      async create(tab) {
        createRequests.push(tab);
        if (failedCreateUrls.includes(tab.url)) {
          throw new Error("tab creation failed");
        }
        const createdTab = { ...tab, index: Math.max(tab.index, pinnedTabCount) };
        createdTabs.push(createdTab);
        return createdTab;
      },
    },
    extension: {
      async isAllowedFileSchemeAccess() {
        if (fileAccessError) {
          throw fileAccessError;
        }

        return fileAccess;
      },
    },
  } });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: {
    clipboard: {
      async readText() {
        if (clipboardReadError) {
          throw clipboardReadError;
        }
        return clipboardText;
      },
      async writeText() {},
    },
  } });
  console.error = () => {};

  try {
    const popupUrl = new URL("../src/popup.js", import.meta.url);
    popupUrl.searchParams.set("test", String(++popupTestId));
    await import(popupUrl.href);
    await elements.get("#open-button").listeners.get("click")();
    return {
      createdTabs,
      createRequests,
      queries,
      status: elements.get("#status").textContent,
    };
  } finally {
    console.error = originalConsoleError;
    for (const [name, descriptor] of originalGlobals) {
      if (descriptor) {
        Object.defineProperty(globalThis, name, descriptor);
      } else {
        delete globalThis[name];
      }
    }
  }
}

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
  assert.match(
    html,
    /<button[^>]+id="open-button"[^>]+aria-describedby="open-help"[^>]*>[\s\S]*Open copied URLs/,
  );
  assert.match(html, /id="open-help"[^>]*>[\s\S]*one URL per line/);
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

test("reads copied URLs on click and opens inactive tabs in the current window", async () => {
  const script = await readSource("../src/popup.js");

  assert.match(script, /openButton\.addEventListener\("click"/);
  assert.match(script, /navigator\.clipboard\.readText\(\)/);
  assert.match(script, /chrome\.extension\.isAllowedFileSchemeAccess\(\)/);
  assert.match(script, /parseUrlList\(/);
  assert.match(script, /chrome\.tabs\.create\(/);
  assert.match(script, /windowId/);
  assert.match(script, /active:\s*false/);
  assert.match(script, /index:/);
  assert.doesNotMatch(script, /\.innerHTML\s*=/);
});

test("opens copied URLs in order while preserving duplicates and active focus", async () => {
  const { createdTabs, createRequests, status } = await runOpenClick({
    clipboardText: [
      "https://example.com/first",
      "file:///tmp/notes.txt",
      "https://example.com/first",
    ].join("\n"),
    fileAccess: true,
  });

  assert.deepEqual(
    createdTabs.map(({ url }) => url),
    [
      "https://example.com/first",
      "file:///tmp/notes.txt",
      "https://example.com/first",
    ],
  );
  assert.deepEqual(
    createRequests.map(({ index }) => index),
    [4, 5, 6],
  );
  assert.deepEqual(createdTabs.map(({ index }) => index), [4, 5, 6]);
  assert.ok(createdTabs.every(({ active, windowId }) => !active && windowId === 7));
  assert.equal(status, "Opened 3 URLs.");
});

test("preserves URL order when the active tab is among pinned tabs", async () => {
  const { createdTabs, createRequests } = await runOpenClick({
    clipboardText: [
      "https://example.com/first",
      "https://example.com/second",
      "https://example.com/third",
    ].join("\n"),
    activeTabIndex: 0,
    pinnedTabCount: 2,
  });

  assert.deepEqual(
    createRequests.map(({ index }) => index),
    [1, 3, 4],
  );
  assert.deepEqual(
    createdTabs.map(({ index }) => index),
    [2, 3, 4],
  );
  assert.deepEqual(
    createdTabs.map(({ url }) => url),
    [
      "https://example.com/first",
      "https://example.com/second",
      "https://example.com/third",
    ],
  );
});

test("skips copied file URLs when file URL access is disabled", async () => {
  const { createdTabs, status } = await runOpenClick({
    clipboardText: "https://example.com/first\nfile:///tmp/notes.txt",
    fileAccess: false,
  });

  assert.deepEqual(
    createdTabs.map(({ url }) => url),
    ["https://example.com/first"],
  );
  assert.match(status, /Opened 1 URL\./);
  assert.match(status, /Skipped 1 local file URL\./);
  assert.match(status, /Allow access to file URLs/);
});

test("opens HTTP URLs when checking file URL access fails", async () => {
  const { createdTabs, status } = await runOpenClick({
    clipboardText: "https://example.com/first\nfile:///tmp/notes.txt",
    fileAccessError: new Error("file access check failed"),
  });

  assert.deepEqual(
    createdTabs.map(({ url }) => url),
    ["https://example.com/first"],
  );
  assert.match(status, /Opened 1 URL\./);
  assert.match(status, /Could not confirm access to 1 local file URL; skipped them\./);
});

test("reports clipboard read failures without opening tabs", async () => {
  const { createdTabs, status } = await runOpenClick({
    clipboardReadError: new Error("clipboard read denied"),
  });

  assert.deepEqual(createdTabs, []);
  assert.match(status, /Could not read clipboard/);
  assert.match(status, /this extension's clipboard permission/);
});

test("reports current tab lookup failures without opening tabs", async () => {
  const { createdTabs, status } = await runOpenClick({
    clipboardText: "https://example.com/first",
    fileAccess: true,
    activeTabQueryError: new Error("query failed"),
  });

  assert.deepEqual(createdTabs, []);
  assert.match(status, /Could not access the current Chrome window/);
});

test("reports a missing active tab without opening tabs", async () => {
  const { createdTabs, status } = await runOpenClick({
    clipboardText: "https://example.com/first",
    fileAccess: true,
    activeTabMissing: true,
  });

  assert.deepEqual(createdTabs, []);
  assert.match(status, /Could not find the current Chrome tab/);
});

test("continues after a tab creation failure and reports partial success", async () => {
  const { createdTabs, status } = await runOpenClick({
    clipboardText: [
      "https://example.com/first",
      "https://example.com/fail",
      "https://example.com/last",
    ].join("\n"),
    failedCreateUrls: ["https://example.com/fail"],
  });

  assert.deepEqual(
    createdTabs.map(({ url }) => url),
    ["https://example.com/first", "https://example.com/last"],
  );
  assert.match(status, /Opened 2 URLs\./);
  assert.match(status, /Could not open 1 URL\./);
});

test("provides visible keyboard focus styling", async () => {
  const styles = await readSource("../src/popup.css");

  assert.match(styles, /:focus-visible/);
  assert.match(styles, /outline:/);
});
