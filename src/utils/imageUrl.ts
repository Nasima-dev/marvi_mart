// Vite eager glob import: bundles all product images from src/assets/images directly into the production build
const bundledAssets = import.meta.glob<{ default: string }>(
  '/src/assets/images/*.{jpg,jpeg,png,webp,svg}',
  { eager: true }
);

const assetPathMap = new Map<string, string>();
for (const [filePath, module] of Object.entries(bundledAssets)) {
  const resolvedUrl = (module as any)?.default || module;
  const fileName = filePath.split('/').pop() || '';
  if (resolvedUrl && typeof resolvedUrl === 'string') {
    assetPathMap.set(filePath, resolvedUrl);
    assetPathMap.set(filePath.replace('/src/assets/images/', '/images/'), resolvedUrl);
    assetPathMap.set(`/images/${fileName}`, resolvedUrl);
    assetPathMap.set(fileName, resolvedUrl);
  }
}

/**
 * Formats product image URLs so they load reliably across development,
 * Node/Express server mode, and production static builds on Netlify Drop.
 */
export function formatProductImageUrl(rawUrl: string | undefined | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return assetPathMap.get('/images/home_decor_brass_vase_1791727457022.jpg') || '/images/home_decor_brass_vase_1791727457022.jpg';
  }

  const trimmed = rawUrl.trim();

  // Keep data URLs, blob URLs, and external HTTP/HTTPS URLs untouched
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return trimmed;
  }

  // Check if Vite bundled asset mapping has a resolved URL for this path
  if (assetPathMap.has(trimmed)) {
    return assetPathMap.get(trimmed)!;
  }

  // Normalize legacy development paths to public production paths
  let normalized = trimmed;
  if (normalized.startsWith('/src/assets/images/')) {
    normalized = normalized.replace('/src/assets/images/', '/images/');
  } else if (normalized.startsWith('src/assets/images/')) {
    normalized = normalized.replace('src/assets/images/', '/images/');
  } else if (normalized.startsWith('/src/assets/')) {
    normalized = normalized.replace('/src/assets/', '/');
  } else if (normalized.startsWith('src/assets/')) {
    normalized = normalized.replace('src/assets/', '/');
  }

  // Check assetPathMap again with normalized path
  if (assetPathMap.has(normalized)) {
    return assetPathMap.get(normalized)!;
  }

  // Also check just by filename
  const fileName = normalized.split('/').pop() || '';
  if (assetPathMap.has(fileName)) {
    return assetPathMap.get(fileName)!;
  }

  // Ensure leading slash for root-relative paths
  if (!normalized.startsWith('/')) {
    return `/${normalized}`;
  }

  return normalized;
}

/**
 * Fallback image handler for <img> tags when a specific angle or detail view fails to load.
 * First tries the product's own base image, then falls back to a verified catalog image.
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrl: string = '/images/home_decor_brass_vase_1791727457022.jpg'
) {
  const target = e.currentTarget;
  const currentSrc = target.getAttribute('src') || '';

  // If a multi-angle variant failed (_angle, _detail, _context), first fall back to the same product's primary front image
  if (
    !target.dataset.triedBase &&
    (currentSrc.includes('_angle.') || currentSrc.includes('_detail.') || currentSrc.includes('_context.'))
  ) {
    target.dataset.triedBase = 'true';
    const baseSrc = currentSrc.replace(/_(angle|detail|context)\./, '.');
    target.src = formatProductImageUrl(baseSrc);
    return;
  }

  if (target.dataset.triedFallback === 'true') {
    return;
  }
  target.dataset.triedFallback = 'true';
  target.src = formatProductImageUrl(fallbackUrl);
}
