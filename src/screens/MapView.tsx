// The map itself. This file (and MapLibre, ~300 KB) is loaded ONLY when the
// user opens a downloaded map, so it never slows down the rest of the app.
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  Map as MapLibre,
  addProtocol,
  setWorkerUrl,
  NavigationControl,
  GeolocateControl,
  type GeoJSONSourceSpecification,
  type LayerSpecification,
  type StyleSpecification
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// MapLibre parses tiles in a Web Worker. Bundle it as our own file so it is
// served (and cached for offline use) from this app, never from a CDN.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { FileSource, PMTiles, Protocol } from 'pmtiles';
import { layers, namedFlavor } from '@protomaps/basemaps';
import { useStore } from '../store';
import { BackLink } from '../components/ui';
import { getRegionFile, glyphsUrl, FONT_STACK } from '../lib/maps';
import { regions, pick } from '../content';

setWorkerUrl(workerUrl);
export { workerUrl };
const protocol = new Protocol();
addProtocol('pmtiles', protocol.tile);

// Places that matter in an emergency, from OpenStreetMap, highlighted on top.
const HELP_KINDS = ['hospital', 'clinic', 'pharmacy', 'fire_station', 'police', 'drinking_water', 'shelter', 'assembly_point'];

function isNight(): boolean {
  const t = document.documentElement.dataset.theme;
  return t === 'night' || (t !== 'light' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
}

function buildStyle(sourceUrl: string, lang: string, meeting: GeoJSONSourceSpecification['data']): StyleSpecification {
  // Offline: one font for all labels (only it is downloaded) and no icon sprites.
  const base = JSON.parse(
    JSON.stringify(layers('protomaps', namedFlavor(isNight() ? 'dark' : 'light'), { lang })).replace(
      /Noto Sans (Medium|Italic)/g,
      FONT_STACK
    )
  ) as LayerSpecification[];
  const noIcons = base.filter((l) => !('layout' in l && l.layout && 'icon-image' in l.layout));

  return {
    version: 8,
    glyphs: glyphsUrl(),
    sources: {
      protomaps: { type: 'vector', url: sourceUrl, attribution: '© OpenStreetMap contributors · Protomaps' },
      meeting: { type: 'geojson', data: meeting }
    },
    layers: [
      ...noIcons,
      {
        id: 'help-places',
        type: 'circle',
        source: 'protomaps',
        'source-layer': 'pois',
        filter: ['in', ['get', 'kind'], ['literal', HELP_KINDS]],
        paint: {
          'circle-radius': 6,
          'circle-color': ['match', ['get', 'kind'], ['hospital', 'clinic', 'pharmacy'], '#C4271D', ['drinking_water'], '#1D6FC4', '#157347'],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2
        }
      },
      {
        id: 'help-labels',
        type: 'symbol',
        source: 'protomaps',
        'source-layer': 'pois',
        filter: ['in', ['get', 'kind'], ['literal', HELP_KINDS]],
        minzoom: 14,
        layout: { 'text-field': ['coalesce', ['get', `name:${lang}`], ['get', 'name']], 'text-font': [FONT_STACK], 'text-size': 12, 'text-offset': [0, 1.2], 'text-anchor': 'top' },
        paint: { 'text-color': isNight() ? '#f1f4f7' : '#0e1b2b', 'text-halo-color': isNight() ? '#000' : '#fff', 'text-halo-width': 1.5 }
      },
      {
        id: 'meeting',
        type: 'circle',
        source: 'meeting',
        paint: { 'circle-radius': 10, 'circle-color': '#FFB020', 'circle-stroke-color': '#0E1B2B', 'circle-stroke-width': 3 }
      },
      {
        id: 'meeting-label',
        type: 'symbol',
        source: 'meeting',
        layout: { 'text-field': ['get', 'label'], 'text-font': [FONT_STACK], 'text-size': 14, 'text-offset': [0, 1.4], 'text-anchor': 'top' },
        paint: { 'text-color': isNight() ? '#ffb020' : '#0e1b2b', 'text-halo-color': isNight() ? '#000' : '#fff', 'text-halo-width': 2 }
      }
    ]
  };
}

export default function MapView(props: { id: string }) {
  const { t, lang, plan } = useStore();
  const el = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const region = regions.find((r) => r.id === props.id);

  useEffect(() => {
    let map: MapLibre | null = null;
    let cancelled = false;
    (async () => {
      const file = await getRegionFile(props.id);
      if (!file || !el.current || cancelled || !region) return setError(true);
      const pm = new PMTiles(new FileSource(file));
      protocol.add(pm);

      const points = (['near', 'far'] as const)
        .filter((w) => plan[w].coords)
        .map((w) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [plan[w].coords!.lon, plan[w].coords!.lat] },
          properties: { label: plan[w].label || t(w === 'near' ? 'plan.near' : 'plan.far') }
        }));

      const [w, s, e, n] = region.bbox;
      map = new MapLibre({
        container: el.current,
        style: buildStyle(`pmtiles://${pm.source.getKey()}`, lang, { type: 'FeatureCollection', features: points }),
        bounds: [w, s, e, n],
        maxBounds: [w - 0.3, s - 0.3, e + 0.3, n + 0.3],
        maxZoom: 17,
        // Battery: no 3D tilt or rotation, no label fade animations, at most 2x pixels.
        maxPitch: 0,
        dragRotate: false,
        pitchWithRotate: false,
        fadeDuration: 0,
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        attributionControl: { compact: true }
      });
      map.touchZoomRotate.disableRotation();
      map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
      map.addControl(
        new GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }),
        'top-right'
      );
    })().catch(() => setError(true));
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [props.id, lang, plan, region, t]);

  return (
    <div class="map-screen">
      <div class="map-top">
        <BackLink to="map" />
        <strong>{region ? pick(region.locales, lang).name : ''}</strong>
      </div>
      {error ? <p class="alert">{t('map.openError')}</p> : <div ref={el} class="map" role="region" aria-label={t('map.title')} />}
      <div class="map-legend">
        <span><i style={{ background: '#C4271D' }} /> {t('map.legendHealth')}</span>
        <span><i style={{ background: '#1D6FC4' }} /> {t('map.legendWater')}</span>
        <span><i style={{ background: '#157347' }} /> {t('map.legendSafety')}</span>
        <span><i style={{ background: '#FFB020' }} /> {t('map.legendMeeting')}</span>
      </div>
    </div>
  );
}
