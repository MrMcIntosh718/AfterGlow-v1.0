import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EventItem } from '../types';

declare global {
  interface Window {
    mapboxgl?: any;
  }
}

interface EventMapProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
}

const MAPBOX_CSS = 'https://api.mapbox.com/mapbox-gl-js/v3.33.0/mapbox-gl.css';
const MAPBOX_JS = 'https://api.mapbox.com/mapbox-gl-js/v3.33.0/mapbox-gl.js';

function loadMapbox(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.mapboxgl) return resolve(window.mapboxgl);

    if (!document.querySelector(`link[href="${MAPBOX_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = MAPBOX_CSS;
      document.head.appendChild(link);
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${MAPBOX_JS}"]`);
    if (existing) {
      existing.addEventListener('load', () => window.mapboxgl ? resolve(window.mapboxgl) : reject(new Error('Mapbox failed to load.')), { once: true });
      existing.addEventListener('error', () => reject(new Error('Mapbox failed to load.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = MAPBOX_JS;
    script.async = true;
    script.onload = () => window.mapboxgl ? resolve(window.mapboxgl) : reject(new Error('Mapbox failed to load.'));
    script.onerror = () => reject(new Error('Mapbox failed to load.'));
    document.head.appendChild(script);
  });
}

export const EventMap: React.FC<EventMapProps> = ({ events, onSelectEvent }) => {
  const mapElement = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const onSelectEventRef = useRef(onSelectEvent);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const token = import.meta.env.NEXT_PUBLIC_MAPBOX_TOKEN as string | undefined;

  const mappableEvents = useMemo(
    () => events.filter((event) => Number.isFinite(event.latitude) && Number.isFinite(event.longitude)),
    [events],
  );

  useEffect(() => {
    onSelectEventRef.current = onSelectEvent;
  }, [onSelectEvent]);

  useEffect(() => {
    if (!token) {
      setMapError('Add NEXT_PUBLIC_MAPBOX_TOKEN to enable the event map.');
      return;
    }

    let cancelled = false;
    let mapInstance: any;

    loadMapbox().then((mapboxgl) => {
      if (cancelled || !mapElement.current || map.current) return;
      mapboxgl.accessToken = token;
      const first = mappableEvents[0];
      mapInstance = new mapboxgl.Map({
        container: mapElement.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: first ? [first.longitude, first.latitude] : [-73.9857, 40.7484],
        zoom: first ? 10 : 3,
        scrollZoom: false,
        attributionControl: true,
      });
      mapInstance.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
      mapInstance.on('load', () => {
        if (!cancelled) setMapReady(true);
      });
      mapInstance.on('error', () => {
        if (!cancelled) setMapError('Mapbox could not load the map. Check the token and allowed website URLs.');
      });
      map.current = mapInstance;
    }).catch(() => {
      if (!cancelled) setMapError('Mapbox could not load. Check your connection and map token.');
    });

    return () => {
      cancelled = true;
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
      mapInstance?.remove();
      map.current = null;
      setMapReady(false);
    };
  }, [token]);

  useEffect(() => {
    const mapboxgl = window.mapboxgl;
    if (!mapReady || !map.current || !mapboxgl) return;

    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    mappableEvents.forEach((event) => {
      const longitude = event.longitude as number;
      const latitude = event.latitude as number;
      const markerElement = document.createElement('button');
      markerElement.type = 'button';
      markerElement.className = 'afterglow-map-marker';
      markerElement.textContent = '•';
      markerElement.setAttribute('aria-label', `Show ${event.title}`);
      markerElement.addEventListener('click', () => onSelectEventRef.current(event));

      const popupContent = document.createElement('div');
      popupContent.className = 'afterglow-map-popup';
      const title = document.createElement('strong');
      title.textContent = event.title;
      const venue = document.createElement('span');
      venue.textContent = [event.venue, event.city, event.state].filter(Boolean).join(', ');
      const date = document.createElement('span');
      date.textContent = event.formattedDate;
      const googleLink = document.createElement('a');
      const destination = [event.venue, event.city, event.state, event.postalCode].filter(Boolean).join(' ');
      googleLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
      googleLink.target = '_blank';
      googleLink.rel = 'noreferrer';
      googleLink.textContent = 'Open directions in Google Maps ↗';
      popupContent.append(title, venue, date, googleLink);

      const popup = new mapboxgl.Popup({ offset: 20, closeButton: true }).setDOMContent(popupContent);
      const marker = new mapboxgl.Marker({ element: markerElement, anchor: 'bottom' })
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(map.current);
      markers.current.push(marker);
      bounds.extend([longitude, latitude]);
    });

    if (mappableEvents.length > 1) {
      map.current.fitBounds(bounds, { padding: 56, maxZoom: 12, duration: 500 });
    } else if (mappableEvents.length === 1) {
      map.current.flyTo({ center: [mappableEvents[0].longitude, mappableEvents[0].latitude], zoom: 11, duration: 500 });
    }
  }, [mapReady, mappableEvents]);

  return (
    <section className="event-map-panel" aria-label="Event map">
      <div className="event-map-heading">
        <div>
          <h2>Explore events on the map</h2>
          <p>{mappableEvents.length} of {events.length} events have venue coordinates.</p>
        </div>
        <span>Mapbox · Google Maps directions</span>
      </div>
      {mapError ? (
        <div className="event-map-fallback" role="status">{mapError}</div>
      ) : (
        <div ref={mapElement} className="event-map-canvas" />
      )}
      {!mapError && mappableEvents.length === 0 && (
        <p className="event-map-note">No coordinates came back for these events yet. You can still browse and search the event list below.</p>
      )}
    </section>
  );
};

