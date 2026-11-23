import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { getPosition, type Coords, type GeoError } from './lib/geo';

export type LocateState =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'ok'; coords: Coords }
  | { status: 'error'; error: GeoError };

/** One-shot location on demand. The GPS is used only when the user asks. */
export function useLocate(): [LocateState, () => Promise<Coords | null>] {
  const [state, setState] = useState<LocateState>({ status: 'idle' });
  const alive = useRef(true);
  useEffect(
    () => () => {
      alive.current = false;
    },
    []
  );
  const locate = useCallback(async () => {
    setState({ status: 'locating' });
    try {
      const coords = await getPosition();
      if (alive.current) setState({ status: 'ok', coords });
      return coords;
    } catch (e) {
      if (alive.current) setState({ status: 'error', error: e as GeoError });
      return null;
    }
  }, []);
  return [state, locate];
}

/** Continuous location, only while the component is mounted. */
export function useWatchPosition(active: boolean): LocateState {
  const [state, setState] = useState<LocateState>({ status: 'idle' });
  useEffect(() => {
    if (!active) return;
    if (!('geolocation' in navigator)) {
      setState({ status: 'error', error: 'unsupported' });
      return;
    }
    setState({ status: 'locating' });
    const id = navigator.geolocation.watchPosition(
      (p) => setState({ status: 'ok', coords: { lat: p.coords.latitude, lon: p.coords.longitude, accuracy: p.coords.accuracy } }),
      (e) => setState({ status: 'error', error: e.code === 1 ? 'denied' : e.code === 3 ? 'timeout' : 'unavailable' }),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [active]);
  return state;
}

type OrientationEventWithCompass = DeviceOrientationEvent & { webkitCompassHeading?: number };
type PermissionFn = () => Promise<'granted' | 'denied'>;

/**
 * Compass heading in degrees (0 = north), or null when the device has no
 * compass. Re-renders only when the heading moves by 3° or more, so a phone
 * held still does not burn battery redrawing the screen.
 */
export function useHeading(): { heading: number | null; needsPermission: boolean; request: () => void } {
  const [heading, setHeading] = useState<number | null>(null);
  const [enabled, setEnabled] = useState(false);
  const needsPermission =
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof (DeviceOrientationEvent as unknown as { requestPermission?: PermissionFn }).requestPermission === 'function';

  const request = useCallback(() => {
    const req = (DeviceOrientationEvent as unknown as { requestPermission?: PermissionFn }).requestPermission;
    if (req) req().then((r) => setEnabled(r === 'granted')).catch(() => setEnabled(false));
    else setEnabled(true);
  }, []);

  useEffect(() => {
    if (!needsPermission) setEnabled(true);
  }, [needsPermission]);

  useEffect(() => {
    if (!enabled) return;
    let last = -999;
    const onEvent = (e: Event) => {
      const ev = e as OrientationEventWithCompass;
      let h: number | null = null;
      if (typeof ev.webkitCompassHeading === 'number') h = ev.webkitCompassHeading; // iOS
      else if (ev.absolute && typeof ev.alpha === 'number') h = (360 - ev.alpha) % 360; // Android
      if (h === null) return;
      const diff = Math.abs(((h - last + 540) % 360) - 180);
      if (diff >= 3) {
        last = h;
        setHeading(h);
      }
    };
    const type = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
    window.addEventListener(type, onEvent);
    return () => window.removeEventListener(type, onEvent);
  }, [enabled]);

  return { heading, needsPermission: needsPermission && !enabled, request };
}
