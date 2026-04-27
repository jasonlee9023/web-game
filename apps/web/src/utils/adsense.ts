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

function findAdsenseScript(clientId: string) {
  const scriptId = getScriptId(clientId);
  const existingById = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (existingById) {
    return existingById;
  }

  return Array.from(document.scripts).find((script) => {
    try {
      const url = new URL(script.src);
      return (
        url.hostname === 'pagead2.googlesyndication.com' &&
        url.pathname === '/pagead/js/adsbygoogle.js' &&
        url.searchParams.get('client') === clientId
      );
    } catch {
      return false;
    }
  }) as HTMLScriptElement | undefined;
}

export function loadAdsense(clientId: string) {
  const existingPromise = scriptPromises.get(clientId);
  if (existingPromise) {
    return existingPromise;
  }

  const scriptId = getScriptId(clientId);
  const existingScript = findAdsenseScript(clientId);

  if (existingScript) {
    existingScript.id ||= scriptId;
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
