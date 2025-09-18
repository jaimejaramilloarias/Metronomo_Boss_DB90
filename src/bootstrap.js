const SOURCE_PATH = './main.jsx';
const STANDALONE_BASE = '../standalone/assets';
const BUNDLED_BASE = '../assets';

const hasViteEnv = typeof import.meta !== 'undefined' && 'env' in import.meta;
const isViteDev = hasViteEnv && import.meta.env.DEV;
const isViteProdBundle = hasViteEnv && import.meta.env.PROD;
const fallbackBase = isViteProdBundle ? BUNDLED_BASE : STANDALONE_BASE;
const fallbackStyle = `${fallbackBase}/main.css`;
const fallbackEntry = `${fallbackBase}/main.js`;

const ensureFallbackStyle = () => {
  if (document.querySelector(`link[data-fallback-style="${fallbackStyle}"]`)) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = fallbackStyle;
  link.dataset.fallbackStyle = fallbackStyle;
  document.head.appendChild(link);
};

const attemptSourceImport = async () => {
  if (isViteDev) {
    await import('./main.jsx');
    return true;
  }

  let shouldAttemptImport = true;

  try {
    const headResponse = await fetch(SOURCE_PATH, { method: 'HEAD' });
    if (headResponse.ok) {
      const contentType = headResponse.headers.get('content-type') || '';
      if (/javascript|ecmascript/i.test(contentType)) {
        await import('./main.jsx');
        return true;
      }
      shouldAttemptImport = false;
    }
  } catch (headError) {
    console.debug('Skipping source preflight due to HEAD error.', headError);
  }

  if (shouldAttemptImport) {
    try {
      await import('./main.jsx');
      return true;
    } catch (error) {
      console.warn('Falling back to prebuilt standalone bundle.', error);
    }
  }

  return false;
};

const importFallback = async () => {
  ensureFallbackStyle();
  await import(fallbackEntry);
};

const bootstrap = async () => {
  if (isViteProdBundle) {
    await importFallback();
    return;
  }

  const loadedFromSource = await attemptSourceImport();
  if (!loadedFromSource) {
    await importFallback();
  }
};

bootstrap();
