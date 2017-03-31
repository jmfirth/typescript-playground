export function getQueryStringParameter(name: string) {
  if (window.location.search.length === 0) { return; }
  const parts = window.location.search.slice(1).split('&');
  const key = `${name}=`;
  const matches = parts
    .map(part => part.startsWith(key) ? part.replace(key, '') : undefined)
    .filter(Boolean) as string[];
  if (matches.length) {
    return matches[0];
  }
  return;
}