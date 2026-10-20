import { useCallback, useEffect, useState } from "react";

const PREFIX = "#slide=";

function readHash(): string | null {
  const hash = window.location.hash;
  return hash.startsWith(PREFIX) ? decodeURIComponent(hash.slice(PREFIX.length)) : null;
}

/**
 * The requested slide id, kept in the URL hash as `#slide=ID` (spec 4.1) so
 * a link opens the same chart. `setSlide` rewrites the hash without adding a
 * history entry per slide.
 */
export function useSlideHash(): [string | null, (id: string) => void] {
  const [requested, setRequested] = useState<string | null>(readHash);

  useEffect(() => {
    // Other hashes (a skip link, say) must not clear the requested slide.
    const onChange = () => {
      const id = readHash();
      if (id !== null) setRequested(id);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const setSlide = useCallback((id: string) => {
    setRequested(id);
    const url = `${window.location.pathname}${window.location.search}${PREFIX}${encodeURIComponent(id)}`;
    window.history.replaceState(null, "", url);
  }, []);

  return [requested, setSlide];
}
