import { formatTabUrls, getCopyableTabs } from "./tab-urls.js";

const tabList = document.querySelector("#tab-list");
const copyButton = document.querySelector("#copy-button");
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
  } catch {
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
  } catch {
    status.textContent = "Could not copy URLs. Check clipboard access and retry.";
  }
});

await loadTabs();
