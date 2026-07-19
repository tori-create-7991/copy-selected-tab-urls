import { formatTabUrls, getCopyableTabs } from "./tab-urls.js";

const COMMAND_NAME = "copy-selected-tab-urls";
const OFFSCREEN_DOCUMENT_PATH = "src/offscreen.html";
const BADGE_DURATION_MS = 2_000;

let creatingOffscreenDocument;
let badgeTimeout;
let badgeUpdate = Promise.resolve();

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
  const query = { highlighted: true };

  if (windowId === undefined) {
    query.lastFocusedWindow = true;
  } else {
    query.windowId = windowId;
  }

  const tabs = await chrome.tabs.query(query);
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

function showBadge(text) {
  const update = badgeUpdate.catch(() => {}).then(async () => {
    clearTimeout(badgeTimeout);
    await chrome.action.setBadgeText({ text });
    badgeTimeout = setTimeout(() => {
      chrome.action
        .setBadgeText({ text: "" })
        .catch((error) => console.error("Failed to clear the badge.", error));
    }, BADGE_DURATION_MS);
  });

  badgeUpdate = update;
  return update;
}

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== COMMAND_NAME) {
    return;
  }

  let count;

  try {
    count = await copySelectedTabUrls(tab?.windowId);
  } catch (error) {
    console.error("Failed to copy selected tab URLs.", error);

    try {
      await showBadge("!");
    } catch (badgeError) {
      console.error("Failed to show the error badge.", badgeError);
    }

    return;
  }

  try {
    await showBadge(String(count));
  } catch (error) {
    console.error("Failed to show the success badge.", error);
  }
});
