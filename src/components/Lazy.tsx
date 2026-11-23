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

const cache = new Map<unknown, ComponentType<any>>();

/**
 * Wraps a screen so its code loads the first time it is shown. Once loaded
 * it renders instantly on every later visit.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyScreen<P extends object = any>(load: () => Promise<ComponentType<P>>): ComponentType<P> {
  return function LazyScreen(props: P) {
    const [Comp, setComp] = useState<ComponentType<P> | null>(() => (cache.get(load) as ComponentType<P>) ?? null);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
      if (Comp) return;
      let alive = true;
      load()
        .then((c) => {
          cache.set(load, c);
          if (alive) setComp(() => c);
        })
        .catch(() => alive && setFailed(true));
      return () => {
        alive = false;
      };
    }, []);
    if (failed)
      return (
        <div class="fallback" role="alert">
          <a class="big-action big-danger" href="tel:112">
            <span class="big-text">
              <span class="big-title">112</span>
            </span>
          </a>
          <button class="btn btn-primary" onClick={() => location.reload()}>
            ↻
          </button>
        </div>
      );
    return Comp ? <Comp {...props} /> : <div class="screen" aria-busy="true" />;
  };
}
