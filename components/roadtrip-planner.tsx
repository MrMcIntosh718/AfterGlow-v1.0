"use client";

import { useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import CityAutocomplete from "@/components/CityAutocomplete";
import BudgetSummary from "@/components/budget-summary";
import { evaluateItineraryTiming, type ItineraryStop, type RouteLeg } from "@/lib/itinerary";
import "./roadtrip-planner.css";

type EventResult = { id: string; name: string; date: string; venue: string; city: string; url: string; image?: string; latitude?: number; longitude?: number; routeDistanceMiles?: number };
type Attraction = {
  id: string;
  name: string;
  address: string;
  type: string;
  rating?: number;
  latitude?: number;
  longitude?: number;
  routeDistanceMiles?: number;
};
type Results = { route: { distanceMiles: number; durationMinutes: number }; events: EventResult[]; attractions: Attraction[]; setup: { ticketmaster: boolean; googlePlaces: boolean } };

export default function RoadtripPlanner() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [eventSort, setEventSort] = useState("date");
  const [eventQuery, setEventQuery] = useState("");
  const [attractionSort, setAttractionSort] = useState("rating");
  const [attractionType, setAttractionType] = useState("all");
  const [attractionQuery, setAttractionQuery] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [customStopTitle, setCustomStopTitle] = useState("");
  const [itineraryStops, setItineraryStops] = useState<ItineraryStop[]>([]);
  const [routeLegs, setRouteLegs] = useState<RouteLeg[]>([]);
  const [routeLegStatus, setRouteLegStatus] = useState("");
  const [routeLegLoading, setRouteLegLoading] = useState(false);
  const lastSuccessfulTripKey = useRef<string | null>(null);
  const timingCheck = useMemo(() => evaluateItineraryTiming(itineraryStops), [itineraryStops]);

  const filteredEvents = useMemo(() => {
    if (!results) return [];
    const query = eventQuery.trim().toLocaleLowerCase();
    return [...results.events]
      .filter((item) => !query || [item.name, item.city, item.venue, item.date].some((v) => v.toLocaleLowerCase().includes(query)))
      .sort((a, b) => {
        if (eventSort === "name") return a.name.localeCompare(b.name);
        if (eventSort === "city") return a.city.localeCompare(b.city) || a.date.localeCompare(b.date);
        if (eventSort === "city-desc") return b.city.localeCompare(a.city) || a.date.localeCompare(b.date);
        if (eventSort === "date-desc") return b.date.localeCompare(a.date) || a.name.localeCompare(b.name);
        return a.date.localeCompare(b.date) || a.name.localeCompare(b.name);
      });
  }, [results, eventSort, eventQuery]);

  const filteredAttractions = useMemo(() => {
    if (!results) return [];
    const query = attractionQuery.trim().toLocaleLowerCase();
    return [...results.attractions]
      .filter((place) => attractionType === "all" || place.type.toLocaleLowerCase().includes(attractionType))
      .filter((place) => !query || [place.name, place.address, place.type].some((v) => v.toLocaleLowerCase().includes(query)))
      .sort((a, b) => {
        if (attractionSort === "name") return a.name.localeCompare(b.name);
        if (attractionSort === "type") return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
        if (attractionSort === "rating-asc") return (a.rating ?? 0) - (b.rating ?? 0) || a.name.localeCompare(b.name);
        return (b.rating ?? 0) - (a.rating ?? 0) || a.name.localeCompare(b.name);
      });
  }, [results, attractionSort, attractionType, attractionQuery]);

  function addItineraryStop(stop: ItineraryStop) {
    setItineraryStops((current) => current.some((item) => item.id === stop.id) ? current : [...current, stop]);
    setRouteLegs([]);
    setRouteLegStatus("");
  }

  function addEventToItinerary(item: EventResult) {
    addItineraryStop({
      id: `event-${item.id}`, title: item.name, kind: "event",
      latitude: item.latitude, longitude: item.longitude,
      locationLabel: [item.venue, item.city].filter(Boolean).join(", "),
      date: /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : "",
      visitDurationMinutes: 120, costStatus: "unknown",
    });
  }

  function addAttractionToItinerary(place: Attraction) {
    addItineraryStop({
      id: `attraction-${place.id}`, title: place.name, kind: "attraction",
      latitude: place.latitude, longitude: place.longitude,
      locationLabel: place.address, date: from, visitDurationMinutes: 120, costStatus: "unknown",
    });
  }

  function updateStop(id: string, changes: Partial<ItineraryStop>) {
    setItineraryStops((current) => current.map((stop) => stop.id === id ? { ...stop, ...changes } : stop));
    setRouteLegs([]);
    setRouteLegStatus("");
  }

  function moveItineraryStop(index: number, delta: -1 | 1) {
    setItineraryStops((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
    setRouteLegs([]);
    setRouteLegStatus("");
  }

  async function calculateRouteLegs() {
    if (itineraryStops.length < 2) {
      setRouteLegStatus("Add at least two stops to calculate route legs.");
      setRouteLegs([]);
      return;
    }
    if (itineraryStops.some((stop) => !Number.isFinite(stop.latitude) || !Number.isFinite(stop.longitude))) {
      setRouteLegStatus("One or more stops do not have coordinates. Route legs cannot be calculated without skipping a stop.");
      setRouteLegs([]);
      return;
    }
    setRouteLegLoading(true);
    setRouteLegStatus("");
    try {
      const response = await fetch("/api/itinerary/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stops: itineraryStops.map(({ id, latitude, longitude }) => ({ id, latitude, longitude })) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Route legs are unavailable.");
      setRouteLegs(data.legs as RouteLeg[]);
      setRouteLegStatus(`Calculated by ${data.source} at ${new Date(data.calculatedAt).toLocaleString()}. Durations exclude traffic, parking, breaks, and visit time.`);
    } catch (err) {
      setRouteLegs([]);
      setRouteLegStatus(err instanceof Error ? err.message : "Route legs are unavailable.");
    } finally {
      setRouteLegLoading(false);
    }
  }

  function addCustomStop() {
    const title = customStopTitle.trim();
    if (!title) return;
    addItineraryStop({
      id: `custom-${Date.now()}`, title, kind: "custom",
      date: from, visitDurationMinutes: 60, costStatus: "unknown",
    });
    setCustomStopTitle("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError(""); setResults(null);
    try {
      const params = new URLSearchParams({ start, end });
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const response = await fetch(`/api/roadtrip?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to plan this trip.");

      const tripKey = [start, end, from, to].map(value => value.trim().toLocaleLowerCase()).join("|");
      if (lastSuccessfulTripKey.current !== null && lastSuccessfulTripKey.current !== tripKey) {
        // Stops selected for a different route/date window must not leak into this trip.
        setItineraryStops([]);
        setRouteLegs([]);
        setRouteLegStatus("");
      }
      lastSuccessfulTripKey.current = tripKey;
      setResults(data as Results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to plan this trip.");
    } finally { setLoading(false); }
  }

  const duration = results ? `${Math.floor(results.route.durationMinutes / 60)} hr ${results.route.durationMinutes % 60} min` : "";
  return <div className="roadtrip-shell">
    <a className="roadtrip-back" href="/">← Back to discovery</a>
    <p className="roadtrip-kicker">THE JOURNEY IS PART OF IT</p>
    <h1>Make the miles <span>memorable.</span></h1>
    <p className="roadtrip-intro">Set your start, destination, and travel dates. Afterglow maps the drive and looks for ticketed events, zoos, water parks, and amusement parks along the route.</p>
    <form className="roadtrip-form" onSubmit={submit}>
      <div className="roadtrip-locations">
        <div><label>Starting point</label><CityAutocomplete name="roadtrip-start" label="Starting point" value={start} onValueChange={setStart} required /></div>
        <div className="roadtrip-swap" aria-hidden="true">→</div>
        <div><label>Destination</label><CityAutocomplete name="roadtrip-end" label="Destination" value={end} onValueChange={setEnd} required /></div>
      </div>
      <div className="roadtrip-dates">
        <label>Travel from<input type="date" value={from} onChange={e => { setFrom(e.target.value); if (to && e.target.value > to) setTo(e.target.value); }} /></label>
        <label>Travel through<input type="date" min={from || undefined} value={to} onChange={e => setTo(e.target.value)} /></label>
      </div>
      <button className="roadtrip-submit" type="submit" disabled={loading || !start.trim() || !end.trim()}>{loading ? "Mapping your trip…" : "Find stops & tickets ↗"}</button>
      <p className="roadtrip-fineprint">Route and event results depend on your Mapbox and Ticketmaster API keys. Attraction discovery also uses Google Places if configured.</p>
    </form>
    {error && <p className="roadtrip-error" role="alert">{error}</p>}
    {results && <section className="roadtrip-results" aria-live="polite">
      <p><a className="roadtrip-map-link" href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(start)}&destination=${encodeURIComponent(end)}&travelmode=driving`} target="_blank" rel="noreferrer">Open driving route in Google Maps ↗</a></p>
      <div className="roadtrip-stats"><div><strong>{results.route.distanceMiles.toLocaleString()} mi</strong><span>Driving distance</span></div><div><strong>{duration}</strong><span>Estimated drive time, without stops</span></div><div><strong>{results.events.length}</strong><span>Ticketed events found</span></div><div><strong>{results.attractions.length}</strong><span>Attractions found</span></div></div>
      {!results.setup.ticketmaster && <p className="roadtrip-notice">Ticketmaster results are off because TICKETMASTER_API_KEY is not configured.</p>}
      {!results.setup.googlePlaces && <p className="roadtrip-notice">To show zoos, water parks, and amusement parks, add GOOGLE_MAPS_API_KEY in .env.local and enable Places API.</p>}
      <h2>Events & tickets along the way</h2>
      <div className="roadtrip-controls" aria-label="Filter and sort ticketed events">
        <label>Search events<input type="search" value={eventQuery} onChange={e => setEventQuery(e.target.value)} placeholder="Artist, event, city, venue…" /></label>
        <label>Sort events<select value={eventSort} onChange={e => setEventSort(e.target.value)}><option value="date">Date: earliest first</option><option value="date-desc">Date: latest first</option><option value="name">Event name: A–Z</option><option value="city">City: A–Z</option><option value="city-desc">City: Z–A</option></select></label>
        <span className="roadtrip-result-count">{filteredEvents.length} of {results.events.length} events</span>
      </div>
      {filteredEvents.length ? <div className="roadtrip-cards">{filteredEvents.map(item => <article className="roadtrip-card" key={item.id}>{item.image && <img src={item.image} alt="" loading="lazy" />}<div><span className="roadtrip-card-meta">{item.date} · {item.city}{typeof item.routeDistanceMiles === "number" ? ` · ${item.routeDistanceMiles.toFixed(1)} mi from route` : ""}</span><h3>{item.name}</h3><p>{item.venue}</p><a href={`/go/ticketmaster?u=${encodeURIComponent(item.url)}`} target="_blank" rel="noreferrer">Tickets & details ↗</a><button type="button" className="roadtrip-add-stop" onClick={() => addEventToItinerary(item)}>{itineraryStops.some(stop => stop.id === `event-${item.id}`) ? "Added to itinerary" : "Add to itinerary"}</button></div></article>)}</div> : <p className="roadtrip-empty">{results.events.length ? "No events match these filters. Try another search or sort option." : "No ticketed events were returned for the selected dates and route. Try widening your dates."}</p>}
      <h2>Family fun & major attractions</h2>
      <div className="roadtrip-controls" aria-label="Filter and sort attractions">
        <label>Search attractions<input type="search" value={attractionQuery} onChange={e => setAttractionQuery(e.target.value)} placeholder="Name or town…" /></label>
        <label>Attraction type<select value={attractionType} onChange={e => setAttractionType(e.target.value)}><option value="all">All attraction types</option><option value="zoo">Zoos</option><option value="water park">Water parks</option><option value="amusement park">Amusement parks</option></select></label>
        <label>Sort attractions<select value={attractionSort} onChange={e => setAttractionSort(e.target.value)}><option value="rating">Highest rated</option><option value="rating-asc">Lowest rated</option><option value="name">Name: A–Z</option><option value="type">Type</option></select></label>
        <span className="roadtrip-result-count">{filteredAttractions.length} of {results.attractions.length} attractions</span>
      </div>
      {filteredAttractions.length ? <div className="roadtrip-attractions">{filteredAttractions.map(place => <article className="roadtrip-attraction" key={place.id}><span>{place.type}</span><h3>{place.name}</h3><p>{place.address}</p>{place.rating ? <small>★ {place.rating}</small> : null}{typeof place.routeDistanceMiles === "number" ? <small> · {place.routeDistanceMiles.toFixed(1)} mi from route</small> : null}<button type="button" className="roadtrip-add-stop" onClick={() => addAttractionToItinerary(place)}>{itineraryStops.some(stop => stop.id === `attraction-${place.id}`) ? "Added to itinerary" : "Add to itinerary"}</button></article>)}</div> : <p className="roadtrip-empty">{results.attractions.length ? "No attractions match these filters. Try another type or search." : "No matching attractions found along the sampled route. Configure Google Places or try another route."}</p>}
      <section className="ag-itinerary" aria-labelledby="ag-itinerary-title">
        <div className="ag-itinerary-head">
          <div><h2 id="ag-itinerary-title">Your manual itinerary</h2><p>Session-only: stops stay in this page state and are not saved to an account.</p></div>
          <label>Party size<input type="number" min="1" max="50" value={partySize} onChange={e => setPartySize(Math.max(1, Math.min(50, Number(e.target.value) || 1)))} /></label>
        </div>
        <div className="ag-custom-stop">
          <label htmlFor="ag-custom-stop-title">Add a custom stop</label>
          <input id="ag-custom-stop-title" value={customStopTitle} onChange={e => setCustomStopTitle(e.target.value)} placeholder="Park, restaurant, rest stop…" onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomStop(); } }} />
          <button type="button" onClick={addCustomStop} disabled={!customStopTitle.trim()}>Add stop</button>
        </div>
        {itineraryStops.length === 0 ? <p className="roadtrip-empty">Add events or attractions above, or create a custom stop. Prices and visit schedules remain unconfirmed until you enter or verify them.</p> : (
          <ol className="ag-itinerary-list">
            {itineraryStops.map((stop, index) => (
              <li key={stop.id} className="ag-itinerary-stop">
                <div className="ag-itinerary-stop-title"><strong>{index + 1}. {stop.title}</strong><span>{stop.kind} · {stop.locationLabel || "Location/coordinates not confirmed"}</span></div>
                <div className="ag-stop-fields">
                  <label>Visit date<input type="date" value={stop.date || ""} onChange={e => updateStop(stop.id, { date: e.target.value })} /></label>
                  <label>Start time<input type="time" value={stop.startTime || ""} onChange={e => updateStop(stop.id, { startTime: e.target.value })} /></label>
                  <label>Visit duration (min)<input type="number" min="1" max="1440" value={stop.visitDurationMinutes} onChange={e => updateStop(stop.id, { visitDurationMinutes: Math.max(1, Math.min(1440, Number(e.target.value) || 1)) })} /></label>
                  <label>Estimated cost/person ($)<input type="number" min="0" step="0.01" value={stop.costStatus === "user-estimate" ? stop.costPerPerson ?? "" : ""} placeholder="Unknown" onChange={e => updateStop(stop.id, { costStatus: e.target.value === "" ? "unknown" : "user-estimate", costPerPerson: e.target.value === "" ? undefined : Math.max(0, Number(e.target.value) || 0), currency: "USD" })} /></label>
                </div>
                <div className="ag-stop-actions">
                  <span className={stop.costStatus === "unknown" ? "ag-status-unknown" : "ag-status-estimate"}>{stop.costStatus === "unknown" ? "Cost unconfirmed" : "Your estimate · USD"}</span>
                  <button type="button" onClick={() => moveItineraryStop(index, -1)} disabled={index === 0} aria-label={`Move ${stop.title} up`}>Move up</button>
                  <button type="button" onClick={() => moveItineraryStop(index, 1)} disabled={index === itineraryStops.length - 1} aria-label={`Move ${stop.title} down`}>Move down</button>
                  <button type="button" onClick={() => { setItineraryStops(current => current.filter(item => item.id !== stop.id)); setRouteLegs([]); }} className="ag-remove-stop">Remove</button>
                </div>
              </li>
            ))}
          </ol>
        )}
        <div className="ag-route-check">
          <button type="button" onClick={calculateRouteLegs} disabled={routeLegLoading || itineraryStops.length < 2}>{routeLegLoading ? "Calculating route legs…" : "Calculate driving legs"}</button>
          {routeLegStatus && <p role="status">{routeLegStatus}</p>}
          {routeLegs.length > 0 && <ul>{routeLegs.map(leg => <li key={`${leg.fromId}-${leg.toId}`}>{itineraryStops.find(s => s.id === leg.fromId)?.title} → {itineraryStops.find(s => s.id === leg.toId)?.title}: {leg.distanceKm} km · {leg.durationMinutes} min <small>({leg.source}; estimate without live traffic)</small></li>)}</ul>}
        </div>
        {(timingCheck.warnings.length > 0 || timingCheck.conflicts.length > 0) && <div className="ag-timing-warnings" role="status">
          <strong>Timing and data checks</strong>
          {timingCheck.conflicts.map((warning, i) => <p key={`c-${i}`}>Schedule conflict: {warning}</p>)}
          {timingCheck.warnings.map((warning, i) => <p key={`w-${i}`}>{warning}</p>)}
        </div>}
        <BudgetSummary stops={itineraryStops} partySize={partySize} routeMiles={results.route.distanceMiles} />
      </section>
      <p className="roadtrip-disclaimer">Events are checked against a 20-mile corridor around the mapped drive; attractions are checked against a 16-mile corridor. Provider coverage is not exhaustive, so verify each venue’s official details and opening dates before traveling. Driving time excludes traffic, breaks, and event time. Itinerary and budget are session-only.</p>
    </section>}
  </div>;
}
