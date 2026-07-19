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
