import { formatTabUrls, getCopyableTabs, parseUrlList } from "./tab-urls.js";

const tabList = document.querySelector("#tab-list");
const copyButton = document.querySelector("#copy-button");
const openButton = document.querySelector("#open-button");
const status = document.querySelector("#status");

let copyableTabs = [];

function renderTabs(tabs) {
  for (const tab of tabs) {
    const item = document.createElement("li");
    const title = document.createElement("span");
    const url = document.createElement("span");

    title.className = "tab-title";
    title.textContent = tab.title || tab.url;
    url.className = "tab-url";
    url.textContent = tab.url;
    item.append(title, url);
    tabList.append(item);
  }
}

async function loadTabs() {
  try {
    const tabs = await chrome.tabs.query({
      highlighted: true,
      currentWindow: true,
    });
    copyableTabs = getCopyableTabs(tabs);
    renderTabs(copyableTabs);

    if (copyableTabs.length === 0) {
      status.textContent = "No selected tabs have an available URL.";
      return;
    }

    copyButton.disabled = false;
    status.textContent = `${copyableTabs.length} selected ${
      copyableTabs.length === 1 ? "tab" : "tabs"
    }.`;
  } catch (error) {
    console.error("Failed to load selected tabs.", error);
    status.textContent = "Could not read the selected tabs.";
  }
}

copyButton.addEventListener("click", async () => {
  const payload = formatTabUrls(copyableTabs);

  try {
    await navigator.clipboard.writeText(payload);
    status.textContent = `Copied ${copyableTabs.length} ${
      copyableTabs.length === 1 ? "URL" : "URLs"
    }.`;
  } catch (error) {
    console.error("Failed to copy selected tab URLs.", error);
    status.textContent = "Could not copy URLs. Check clipboard access and retry.";
  }
});

openButton.addEventListener("click", async () => {
  openButton.disabled = true;

  let clipboardText;
  try {
    clipboardText = await navigator.clipboard.readText();
  } catch (error) {
    console.error("Failed to read clipboard text.", error);
    status.textContent = "Could not read clipboard. Check clipboard access and retry.";
    openButton.disabled = false;
    return;
  }

  if (clipboardText.trim().length === 0) {
    status.textContent = "Clipboard is empty.";
    openButton.disabled = false;
    return;
  }

  let allowFile;
  try {
    allowFile = await chrome.extension.isAllowedFileSchemeAccess();
  } catch (error) {
    console.error("Failed to check file URL access.", error);
    status.textContent = "Could not check access to local file URLs.";
    openButton.disabled = false;
    return;
  }

  const parsed = parseUrlList(clipboardText, { allowFile });
  let openedCount = 0;
  let failedCount = 0;

  if (parsed.urls.length > 0) {
    try {
      const [activeTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!activeTab) {
        status.textContent = "Could not find the current Chrome tab.";
        openButton.disabled = false;
        return;
      }

      let nextIndex = activeTab.index + 1;
      for (const url of parsed.urls) {
        try {
          await chrome.tabs.create({
            windowId: activeTab.windowId,
            index: nextIndex,
            url,
            active: false,
          });
          openedCount += 1;
          nextIndex += 1;
        } catch {
          failedCount += 1;
        }
      }
    } catch (error) {
      console.error("Failed to open clipboard URLs.", error);
      status.textContent = "Could not access the current Chrome window.";
      openButton.disabled = false;
      return;
    }
  }

  const messages = [
    `Opened ${openedCount} ${openedCount === 1 ? "URL" : "URLs"}.`,
  ];
  const invalidCount = parsed.invalidCount + parsed.unsupportedCount;
  if (invalidCount > 0) {
    messages.push(
      `Skipped ${invalidCount} invalid or unsupported ${
        invalidCount === 1 ? "line" : "lines"
      }.`,
    );
  }
  if (parsed.blockedFileCount > 0) {
    messages.push(
      `Skipped ${parsed.blockedFileCount} local ${
        parsed.blockedFileCount === 1 ? "file URL" : "file URLs"
      }. Allow access to file URLs in this extension's Details page.`,
    );
  }
  if (failedCount > 0) {
    messages.push(
      `Could not open ${failedCount} ${failedCount === 1 ? "URL" : "URLs"}.`,
    );
  }

  status.textContent = messages.join(" ");
  openButton.disabled = false;
});

await loadTabs();
