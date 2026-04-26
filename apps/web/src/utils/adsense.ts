const scriptIdPrefix = 'adsense-script-';
const scriptPromises = new Map<string, Promise<void>>();

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

function getScriptId(clientId: string) {
  return `${scriptIdPrefix}${clientId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

export function loadAdsense(clientId: string) {
  const existingPromise = scriptPromises.get(clientId);
  if (existingPromise) {
    return existingPromise;
  }

  const scriptId = getScriptId(clientId);
  const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

  if (existingScript?.dataset.loaded === 'true') {
    const resolved = Promise.resolve();
    scriptPromises.set(clientId, resolved);
    return resolved;
  }

  const promise = new Promise<void>((resolve, reject) => {
    const script = existingScript ?? document.createElement('script');

    script.async = true;
    script.crossOrigin = 'anonymous';
    script.id = scriptId;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => {
      scriptPromises.delete(clientId);
      reject(new Error('Failed to load AdSense script'));
    };

    if (!existingScript) {
      document.head.appendChild(script);
    }
  });

  scriptPromises.set(clientId, promise);
  return promise;
}

export function requestAdsenseAd() {
  window.adsbygoogle = window.adsbygoogle ?? [];
  window.adsbygoogle.push({});
}
