/** Resolve heatmap / map image src from static URL or legacy base64 field. */
export function imageSrcFromPayload(
  url?: string | null,
  b64?: string | null,
): string | null {
  if (url) return url;
  if (b64) return `data:image/png;base64,${b64}`;
  return null;
}
