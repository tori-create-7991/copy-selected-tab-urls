export function getCopyableTabs(tabs) {
  return tabs
    .filter(({ url }) => typeof url === "string" && url.length > 0)
    .sort((left, right) => left.index - right.index);
}

export function formatTabUrls(tabs) {
  return getCopyableTabs(tabs)
    .map(({ url }) => url)
    .join("\n");
}

export function parseUrlList(input, { allowFile = false } = {}) {
  const result = {
    urls: [],
    emptyCount: 0,
    invalidCount: 0,
    unsupportedCount: 0,
    blockedFileCount: 0,
  };

  if (typeof input !== "string") {
    return result;
  }

  for (const line of input.split(/\r?\n/)) {
    const trimmedLine = line.trim();
    if (trimmedLine.length === 0) {
      result.emptyCount += 1;
      continue;
    }

    let url;
    try {
      url = new URL(trimmedLine);
    } catch {
      result.invalidCount += 1;
      continue;
    }

    if (url.protocol === "file:") {
      if (url.host.length > 0) {
        result.unsupportedCount += 1;
      } else if (allowFile) {
        result.urls.push(url.href);
      } else {
        result.blockedFileCount += 1;
      }
      continue;
    }

    if (url.protocol === "http:" || url.protocol === "https:") {
      result.urls.push(url.href);
      continue;
    }

    result.unsupportedCount += 1;
  }

  return result;
}
