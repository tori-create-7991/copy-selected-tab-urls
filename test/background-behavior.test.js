import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

const originalSetTimeout = globalThis.setTimeout;
const originalClearTimeout = globalThis.clearTimeout;
const originalConsoleError = console.error;
let backgroundImportId = 0;

afterEach(() => {
  delete globalThis.chrome;
  delete globalThis.self;
  globalThis.setTimeout = originalSetTimeout;
  globalThis.clearTimeout = originalClearTimeout;
  console.error = originalConsoleError;
});

async function loadBackground({
  tabsQuery = async () => [],
  createDocument = async () => {},
  sendMessage = async () => ({ ok: true }),
  setBadgeText,
} = {}) {
  const commandListeners = [];
  const queries = [];
  const badgeWrites = [];
  const timers = new Map();
  let timerId = 0;

  globalThis.setTimeout = (callback) => {
    const id = ++timerId;
    timers.set(id, callback);
    return id;
  };
  globalThis.clearTimeout = (id) => {
    timers.delete(id);
  };
  globalThis.chrome = {
    action: {
      setBadgeText:
        setBadgeText ??
        (async ({ text }) => {
          badgeWrites.push(text);
        }),
    },
    commands: {
      onCommand: {
        addListener(listener) {
          commandListeners.push(listener);
        },
      },
    },
    offscreen: { createDocument },
    runtime: {
      getURL: (path) => `chrome-extension://test/${path}`,
      sendMessage,
    },
    tabs: {
      async query(query) {
        queries.push(query);
        return tabsQuery(query);
      },
    },
  };
  globalThis.self = {
    clients: {
      matchAll: async () => [],
    },
  };

  await import(`../src/background.js?test=${++backgroundImportId}`);

  return {
    badgeWrites,
    listener: commandListeners[0],
    queries,
    timers,
  };
}

test("skips offscreen creation when no tab URL is available", async () => {
  let createCalls = 0;
  let messageCalls = 0;
  const background = await loadBackground({
    tabsQuery: async () => [{ index: 0, url: "" }],
    createDocument: async () => {
      createCalls += 1;
    },
    sendMessage: async () => {
      messageCalls += 1;
      return { ok: true };
    },
  });

  await background.listener("copy-selected-tab-urls", { windowId: 7 });

  assert.equal(createCalls, 0);
  assert.equal(messageCalls, 0);
  assert.deepEqual(background.badgeWrites, ["0"]);
});

test("shares one offscreen creation across concurrent commands", async () => {
  let createCalls = 0;
  let resolveCreation;
  const creation = new Promise((resolve) => {
    resolveCreation = resolve;
  });
  const background = await loadBackground({
    tabsQuery: async () => [{ index: 0, url: "https://example.com" }],
    createDocument: async () => {
      createCalls += 1;
      await creation;
    },
  });

  const firstCopy = background.listener("copy-selected-tab-urls", {
    windowId: 7,
  });
  const secondCopy = background.listener("copy-selected-tab-urls", {
    windowId: 7,
  });

  for (let attempt = 0; attempt < 10 && createCalls === 0; attempt += 1) {
    await Promise.resolve();
  }

  assert.equal(createCalls, 1);
  resolveCreation();
  await Promise.all([firstCopy, secondCopy]);
});

test("uses the last focused window when the command has no tab", async () => {
  const background = await loadBackground();

  await background.listener("copy-selected-tab-urls");

  assert.deepEqual(background.queries, [
    { highlighted: true, lastFocusedWindow: true },
  ]);
  assert.deepEqual(background.badgeWrites, ["0"]);
});

test("serializes badge updates so only the latest clear timer remains", async () => {
  let queryCalls = 0;
  const background = await loadBackground({
    tabsQuery: async () => {
      queryCalls += 1;
      return Array.from({ length: queryCalls }, (_, index) => ({
        index,
        url: `https://example.com/${index}`,
      }));
    },
  });

  await Promise.all([
    background.listener("copy-selected-tab-urls", { windowId: 7 }),
    background.listener("copy-selected-tab-urls", { windowId: 7 }),
  ]);

  assert.deepEqual(background.badgeWrites, ["1", "2"]);
  assert.equal(background.timers.size, 1);

  const [clearLatestBadge] = background.timers.values();
  clearLatestBadge();
  await Promise.resolve();

  assert.deepEqual(background.badgeWrites, ["1", "2", ""]);
});

test("logs an offscreen failure and shows an error badge", async () => {
  const errors = [];
  console.error = (...args) => errors.push(args);
  const background = await loadBackground({
    tabsQuery: async () => [{ index: 0, url: "https://example.com" }],
    sendMessage: async () => ({ ok: false, error: "clipboard denied" }),
  });

  await background.listener("copy-selected-tab-urls", { windowId: 7 });

  assert.equal(errors.length, 1);
  assert.match(errors[0][0], /copy selected tab URLs/i);
  assert.deepEqual(background.badgeWrites, ["!"]);
});

test("logs badge-clear failures without creating an unhandled rejection", async () => {
  const errors = [];
  const badgeWrites = [];
  console.error = (...args) => errors.push(args);
  const background = await loadBackground({
    setBadgeText: async ({ text }) => {
      badgeWrites.push(text);

      if (text === "") {
        throw new Error("badge unavailable");
      }
    },
  });

  await background.listener("copy-selected-tab-urls", { windowId: 7 });

  const [clearBadge] = background.timers.values();
  clearBadge();
  await Promise.resolve();
  await Promise.resolve();

  assert.deepEqual(badgeWrites, ["0", ""]);
  assert.equal(errors.length, 1);
  assert.match(errors[0][0], /clear the badge/i);
});

test("reports a success-badge failure separately from copy failures", async () => {
  const errors = [];
  console.error = (...args) => errors.push(args);
  const background = await loadBackground({
    setBadgeText: async () => {
      throw new Error("badge unavailable");
    },
  });

  await background.listener("copy-selected-tab-urls", { windowId: 7 });

  assert.equal(errors.length, 1);
  assert.match(errors[0][0], /success badge/i);
  assert.doesNotMatch(errors[0][0], /copy selected tab URLs/i);
});
