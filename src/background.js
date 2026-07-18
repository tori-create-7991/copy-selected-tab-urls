import { formatTabUrls, getCopyableTabs } from "./tab-urls.js";

const COMMAND_NAME = "copy-selected-tab-urls";
const OFFSCREEN_DOCUMENT_PATH = "src/offscreen.html";
const BADGE_DURATION_MS = 2_000;

let creatingOffscreenDocument;
let badgeTimeout;

async function offscreenDocumentExists() {
  const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH);
  const matchedClients = await self.clients.matchAll({
    includeUncontrolled: true,
    type: "window",
  });

  return matchedClients.some(({ url }) => url === offscreenUrl);
}

async function ensureOffscreenDocument() {
  if (creatingOffscreenDocument) {
    return creatingOffscreenDocument;
  }

  creatingOffscreenDocument = (async () => {
    if (await offscreenDocumentExists()) {
      return;
    }

    await chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: ["CLIPBOARD"],
      justification: "Copy selected tab URLs to the clipboard",
    });
  })();

  try {
    await creatingOffscreenDocument;
  } finally {
    creatingOffscreenDocument = undefined;
  }
}

async function copySelectedTabUrls(windowId) {
  const tabs = await chrome.tabs.query({
    highlighted: true,
    windowId,
  });
  const copyableTabs = getCopyableTabs(tabs);
  const payload = formatTabUrls(copyableTabs);

  if (!payload) {
    return 0;
  }

  await ensureOffscreenDocument();
  const response = await chrome.runtime.sendMessage({
    target: "offscreen",
    type: "copy-tab-urls",
    text: payload,
  });

  if (!response?.ok) {
    throw new Error(response?.error || "The offscreen clipboard write failed.");
  }

  return copyableTabs.length;
}

async function showBadge(text) {
  clearTimeout(badgeTimeout);
  await chrome.action.setBadgeText({ text });
  badgeTimeout = setTimeout(() => {
    chrome.action.setBadgeText({ text: "" });
  }, BADGE_DURATION_MS);
}

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== COMMAND_NAME) {
    return;
  }

  try {
    const count = await copySelectedTabUrls(tab.windowId);
    await showBadge(String(count));
  } catch {
    await showBadge("!");
  }
});
