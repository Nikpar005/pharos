import { useEffect, useState } from 'preact/hooks';
import type { ComponentType } from 'preact';

/**
 * Loads a screen's code only when it is first shown. Used for heavy, rarely
 * used screens (the map) so start-up stays small on old phones.
 */
export function Lazy<P extends object>(props: { load: () => Promise<{ default: ComponentType<P> }>; props: P; loading: string; error: string }) {
  const [Comp, setComp] = useState<ComponentType<P> | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    props
      .load()
      .then((m) => alive && setComp(() => m.default))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [props.load]);
  if (failed) return <p class="alert">{props.error}</p>;
  return Comp ? <Comp {...props.props} /> : <p class="center muted lazy-loading">{props.loading}</p>;
}
