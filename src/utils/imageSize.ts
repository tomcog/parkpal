// Rewrites the `w=` query parameter on an Unsplash URL to request a smaller
// rendition. Keeps the URL unchanged for non-Unsplash sources (user uploads,
// data: URIs, etc.) so callers can pass any image URL safely.
export function resizeUnsplashUrl(url: string, width: number): string {
  if (!url.includes("images.unsplash.com")) return url;
  if (url.includes("w=")) return url.replace(/([?&])w=\d+/, `$1w=${width}`);
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}w=${width}`;
}
