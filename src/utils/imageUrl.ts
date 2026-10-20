
const FALLBACK_IMAGE =
  '/images/farshi_salwar_suit_1791974973122.jpg';

export function formatProductImageUrl(
  rawUrl: string | undefined | null
): string {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return FALLBACK_IMAGE;
  }

  const trimmed = rawUrl.trim();

  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    /^https?:\/\//i.test(trimmed)
  ) {
    return trimmed;
  }

  let normalized = trimmed.replace(/\\/g, '/');

  normalized = normalized
    .replace(/^\/?src\/assets\/images\//, '/images/')
    .replace(/^\/?public\/images\//, '/images/');

  if (!normalized.startsWith('/')) {
    normalized = `/images/${normalized}`;
  }

  return normalized;
}

export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrl: string = FALLBACK_IMAGE
) {
  const target = e.currentTarget;
  const currentSrc = target.getAttribute('src') || '';

  if (
    !target.dataset.triedBase &&
    /_(angle|detail|context)\.[^/?#]+(?:[?#].*)?$/.test(currentSrc)
  ) {
    target.dataset.triedBase = 'true';

    target.src = formatProductImageUrl(
      currentSrc.replace(
        /_(angle|detail|context)(\.[^/?#]+)(?:[?#].*)?$/,
        '$2'
      )
    );

    return;
  }

  if (target.dataset.triedFallback === 'true') return;

  target.dataset.triedFallback = 'true';
  target.src = formatProductImageUrl(fallbackUrl);
}
