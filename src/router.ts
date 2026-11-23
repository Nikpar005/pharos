// Hash routing (#/kit, #/guides/earthquake): works on GitHub Pages and
// offline without any server rewrite rules.
import { useEffect, useState } from 'preact/hooks';

function current(): string[] {
  return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
}

export function useRoute(): string[] {
  const [route, setRoute] = useState(current);
  useEffect(() => {
    const on = () => {
      setRoute(current());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function href(path: string): string {
  return `#/${path.replace(/^\//, '')}`;
}

export function navigate(path: string): void {
  location.hash = href(path);
}
