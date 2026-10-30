"use client";

import { useEffect, useRef, useState } from "react";
import type { EventItem } from "@/lib/types";

type Center = { latitude: number; longitude: number };
type LeafletMapProps = {
  events: EventItem[];
  selectedId?: string;
  hoveredId?: string | null;
  onSelect: (event: EventItem) => void;
  onSearchThisArea: (center: Center) => void;
};

declare global {
  interface Window { L?: any; }
}

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

function loadLeaflet(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L);
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${LEAFLET_JS}"]`);
    if (existing) {
      existing.addEventListener("load", () => window.L ? resolve(window.L) : reject(new Error("Map library failed.")), { once: true });
      existing.addEventListener("error", () => reject(new Error("Map library failed.")), { once: true });
      if (window.L) resolve(window.L);
      return;
    }
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => window.L ? resolve(window.L) : reject(new Error("Map library failed."));
    script.onerror = () => reject(new Error("Map library failed."));
    document.head.appendChild(script);
  });
}

export default function EventMap({ events, selectedId, hoveredId, onSelect, onSearchThisArea }: LeafletMapProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const callbacksRef = useRef({ onSelect, onSearchThisArea });
  const [mapFailed, setMapFailed] = useState(false);
  const [viewportChanged, setViewportChanged] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => { callbacksRef.current = { onSelect, onSearchThisArea }; }, [onSelect, onSearchThisArea]);

  useEffect(() => {
    let disposed = false;
    let map: any;
    loadLeaflet().then((L) => {
      if (disposed || !elementRef.current || mapRef.current) return;
      const mapped = events.filter((e) => Number.isFinite(e.latitude) && Number.isFinite(e.longitude));
      const first = mapped[0];
      map = L.map(elementRef.current, { scrollWheelZoom: false }).setView(
        first ? [first.latitude, first.longitude] : [39.5, -98.35],
        first ? 9 : 4
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      map.on("moveend", () => setViewportChanged(true));
      mapRef.current = map;
      setMapReady(true);
    }).catch(() => { if (!disposed) setMapFailed(true); });
    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current.clear();
    };
    // The map instance is intentionally created once; markers update in a separate effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const L = window.L;
    if (!map || !L) return;
    const valid = events.filter((e) => Number.isFinite(e.latitude) && Number.isFinite(e.longitude));
    const wanted = new Set(valid.map((e) => `${e.partner}:${e.id}`));
    markersRef.current.forEach((marker, key) => {
      if (!wanted.has(key)) { marker.remove(); markersRef.current.delete(key); }
    });
    valid.forEach((event) => {
      const key = `${event.partner}:${event.id}`;
      const active = event.id === selectedId || event.id === hoveredId;
      const icon = L.divIcon({
        className: "ag-map-marker-wrap",
        html: `<span class="ag-map-marker${active ? " is-active" : ""}">${active ? "★" : "•"}</span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      let marker = markersRef.current.get(key);
      if (!marker) {
        marker = L.marker([event.latitude, event.longitude], { title: event.name, icon }).addTo(map);
        marker._afterglowEvent = event;
        marker.on("click", () => {
          if (marker._afterglowEvent) callbacksRef.current.onSelect(marker._afterglowEvent as EventItem);
        });
        markersRef.current.set(key, marker);
      } else {
        marker.setLatLng([event.latitude, event.longitude]);
        marker.setIcon(icon);
        marker._afterglowEvent = event;
      }
      const tooltip = document.createElement("span");
      tooltip.textContent = event.name;
      marker.bindTooltip(tooltip, { direction: "top" });
    });
  }, [events, selectedId, hoveredId, mapReady]);

  const mappedCount = events.filter((e) => Number.isFinite(e.latitude) && Number.isFinite(e.longitude)).length;

  function searchArea() {
    const map = mapRef.current;
    if (!map) return;
    const center = map.getCenter();
    setViewportChanged(false);
    callbacksRef.current.onSearchThisArea({ latitude: center.lat, longitude: center.lng });
  }

  return (
    <section className="ag-map-panel" aria-label="Event map">
      <div className="ag-map-heading">
        <div>
          <h3>Explore the map</h3>
          <p>{mappedCount} of {events.length} events have mappable venue coordinates.</p>
        </div>
        {viewportChanged && mapReady && (
          <button type="button" onClick={searchArea}>Search this area</button>
        )}
      </div>
      {mapFailed ? (
        <div className="ag-map-fallback" role="status">
          <strong>Map could not load.</strong>
          <span>The event list still works. Check your connection or content-blocking settings.</span>
        </div>
      ) : (
        <div ref={elementRef} className="ag-map-canvas" />
      )}
      {!mapFailed && mappedCount === 0 && (
        <p className="ag-map-note">No returned events include venue coordinates yet. Try another search; events without coordinates remain available in the list.</p>
      )}
      <p className="ag-map-attribution-note">Map tiles © OpenStreetMap contributors. Markers show provider venue coordinates when supplied.</p>
    </section>
  );
}
