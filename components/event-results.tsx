"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { goLink } from "@/lib/affiliate";
import type { EventItem } from "@/lib/types";
import EventMap from "@/components/event-map";
import "./events-ui.css";

type SortKey = "best" | "soonest" | "name";

type EventGroup = {
  key: string;
  title: string;
  events: EventItem[];
  isTeamGroup: boolean;
};

type EventResultsProps = {
  initialEvents: EventItem[];
  initialHasMore: boolean;
  query: string;
  city: string;
  from: string;
  to: string;
  category: string;
  radius: number;
};

// Fixed locale and UTC so server and browser render the same text.
function formatDate(value: string) {
  if (!value) return "";
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function sortEvents(events: EventItem[], key: SortKey): EventItem[] {
  // "best" keeps the order Ticketmaster returned (relevance).
  if (key === "best") return events;

  const copy = [...events];

  if (key === "soonest") {
    copy.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });
  } else {
    copy.sort((a, b) => a.name.localeCompare(b.name));
  }

  return copy;
}


function getSportsTeam(name: string): string | null {
  // Ticketmaster commonly names matchups as "Away Team at Home Team" or
  // "Team A vs. Team B". Use the home side for "at" and the first side for
  // "vs" so multiple games can be grouped under a team's name.
  const atMatch = name.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
  if (atMatch) return atMatch[2].trim();

  const versusMatch = name.match(/^(.+?)\s+(?:vs?\.?|versus)\s+(.+)$/i);
  if (versusMatch) return versusMatch[1].trim();

  return null;
}

function groupEvents(
  items: EventItem[],
  category: string,
  query: string
): EventGroup[] {
  const sportsSearch =
    category.toLowerCase() === "sports" ||
    /\b(sports?|nba|wnba|nfl|mlb|nhl|mls|basketball|football|baseball|hockey)\b/i.test(query);
  const groups = new Map<string, EventGroup>();

  for (const event of items) {
    const team = sportsSearch ? getSportsTeam(event.name) : null;
    const locationKey = `${event.city.toLowerCase()}|${event.venue.toLowerCase()}`;
    const normalizedName = event.name.toLowerCase().replace(/\s+/g, " ").trim();
    const key = team
      ? `team|${locationKey}|${team.toLowerCase()}`
      : `event|${locationKey}|${normalizedName}`;

    const existing = groups.get(key);
    if (existing) {
      if (!existing.events.some((item) => item.id === event.id && item.partner === event.partner)) {
        existing.events.push(event);
      }
    } else {
      groups.set(key, {
        key,
        title: team ?? event.name,
        events: [event],
        isTeamGroup: Boolean(team),
      });
    }
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    events: [...group.events].sort((a, b) => a.date.localeCompare(b.date)),
  }));
}

function EventImage({ event, sizes }: { event: EventItem; sizes: string }) {
  const [failed, setFailed] = useState(false);

  if (!event.image || failed) {
    return (
      <div className="ev-media-fallback" aria-hidden="true">
        ✦
      </div>
    );
  }

  return (
    <Image
      src={event.image}
      alt=""
      fill
      sizes={sizes}
      className="ev-img"
      onError={() => setFailed(true)}
    />
  );
}

function eventMeta(event: EventItem) {
  const place = [event.venue, event.city].filter(Boolean).join(", ");
  return [formatDate(event.date), place].filter(Boolean).join(" · ");
}

function TopPicks({ picks }: { picks: EventItem[] }) {
  const trackRef = useRef<HTMLUListElement>(null);

  function scrollByPage(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction * track.clientWidth * 0.9,
      behavior: "smooth",
    });
  }

  return (
    <section className="ev-picks" aria-label="Top picks">
      <div className="ev-picks-head">
        <h3>Top picks</h3>
        <div className="ev-picks-controls">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            aria-label="Previous picks"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            aria-label="Next picks"
          >
            →
          </button>
        </div>
      </div>

      <ul className="ev-picks-track" ref={trackRef}>
        {picks.map((event) => (
          <li className="ev-pick-item" key={`${event.partner}-${event.id}`}>
            <a
              className="ev-pick"
              href={goLink(event.partner, event.url)}
              rel="sponsored noopener noreferrer"
              target="_blank"
            >
              <div className="ev-media">
                <EventImage event={event} sizes="(max-width: 640px) 80vw, 272px" />
              </div>
              <div className="ev-pick-body">
                <span className="ev-pick-name">{event.name}</span>
                <span className="ev-meta">{eventMeta(event)}</span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function EventResults({
  initialEvents,
  initialHasMore,
  query,
  city,
  from,
  to,
  category,
  radius,
}: EventResultsProps) {
  const [events, setEvents] = useState(initialEvents);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextPage, setNextPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sort, setSort] = useState<SortKey>("best");
  const [selectedKey, setSelectedKey] = useState<string | undefined>();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [areaSearchLoading, setAreaSearchLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number } | null>(null);

  // Top picks use one representative per recurring event/team group.
  const picks = useMemo(() => {
    return groupEvents(initialEvents, category, query)
      .map((group) => group.events.find((event) => event.image) ?? group.events[0])
      .filter((event) => event.image)
      .slice(0, 6);
  }, [initialEvents, category, query]);

  const sortedEvents = useMemo(() => sortEvents(events, sort), [events, sort]);
  const eventGroups = useMemo(
    () => groupEvents(sortedEvents, category, query),
    [sortedEvents, category, query]
  );

  async function searchThisArea(center: { latitude: number; longitude: number }) {
    if (areaSearchLoading) return;
    setAreaSearchLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        q: query,
        lat: String(center.latitude),
        lon: String(center.longitude),
        from,
        to,
        category,
        radius: String(radius),
        page: "0",
      });
      const response = await fetch(`/api/events?${params.toString()}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not search this map area.");
      setEvents(Array.isArray(result.events) ? result.events : []);
      setMapCenter(center);
      setHasMore(Boolean(result.hasMore));
      setNextPage(1);
      setSelectedKey(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not search this map area.");
    } finally {
      setAreaSearchLoading(false);
    }
  }

  function selectEvent(event: EventItem) {
    const key = `${event.partner}:${event.id}`;
    setSelectedKey(key);
    const group = eventGroups.find((item) => item.events.some((candidate) => `${candidate.partner}:${candidate.id}` === key));
    const cardEvent = group?.events[0] ?? event;
    document.getElementById(`event-${encodeURIComponent(`${cardEvent.partner}:${cardEvent.id}`)}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function loadMore() {
    if (loading || !hasMore) return;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        q: query,
        city: mapCenter ? "" : city,
        from,
        to,
        category,
        radius: String(radius),
        page: String(nextPage),
      });
      if (mapCenter) {
        params.set("lat", String(mapCenter.latitude));
        params.set("lon", String(mapCenter.longitude));
      }

      const response = await fetch(`/api/events?${params.toString()}`);

      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(
          failure?.error ??
            (response.status === 429
              ? "You're searching too quickly. Please wait a moment."
              : "The event search request failed.")
        );
      }

      const result: {
        events: EventItem[];
        hasMore: boolean;
      } = await response.json();

      setEvents((current) => {
        // Prevent duplicate cards on pagination
        const existingIds = new Set(
          current.map((event) => `${event.partner}-${event.id}`)
        );

        const additions = result.events.filter(
          (event) => !existingIds.has(`${event.partner}-${event.id}`)
        );

        return [...current, ...additions];
      });

      setHasMore(result.hasMore);
      setNextPage((page) => page + 1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't load more events. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ev-root">
      {picks.length >= 3 && <TopPicks picks={picks} />}

      <div className="ev-toolbar">
        <p className="ev-count">
          {eventGroups.length} event group{eventGroups.length === 1 ? "" : "s"}
          {events.length > eventGroups.length ? ` · ${events.length} dates` : ""}
          {hasMore ? "+" : ""}
        </p>

        <label className="ev-sort">
          <span>Sort by</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
          >
            <option value="best">Best match</option>
            <option value="soonest">Soonest date</option>
            <option value="name">Name (A–Z)</option>
          </select>
        </label>
      </div>

      <EventMap
        events={sortedEvents}
        selectedId={selectedKey?.split(":").slice(1).join(":")}
        hoveredId={hoveredKey?.split(":").slice(1).join(":") ?? null}
        onSelect={selectEvent}
        onSearchThisArea={searchThisArea}
      />
      {areaSearchLoading && <p className="ev-map-search-status" role="status">Searching the visible map area…</p>}

      <ul className="ev-list">
        {eventGroups.map((group) => {
          const event = group.events[0];
          const recurring = group.events.length > 1;

          return (
            <li
              id={`event-${encodeURIComponent(`${event.partner}:${event.id}`)}`}
              className={`ev-card${recurring ? " ev-card-grouped" : ""}${group.events.some((candidate) => selectedKey === `${candidate.partner}:${candidate.id}`) ? " ev-card-selected" : ""}`}
              key={group.key}
              onMouseEnter={() => setHoveredKey(`${event.partner}:${event.id}`)}
              onMouseLeave={() => setHoveredKey(null)}
            >
              <div className="ev-media">
                <EventImage event={event} sizes="(max-width: 640px) 100vw, 144px" />
              </div>

              <div className="ev-card-body">
                <h3 className="ev-card-name">{group.title}</h3>
                {Number.isFinite(event.latitude) && Number.isFinite(event.longitude) && (
                  <button type="button" className="ev-show-on-map" onClick={() => selectEvent(event)}>Show on map</button>
                )}
                {recurring ? (
                  <>
                    <p className="ev-meta">
                      {group.events.length} upcoming dates · {[event.venue, event.city].filter(Boolean).join(", ")}
                    </p>
                    <details className="ev-group-dates">
                      <summary>View all dates</summary>
                      <ul className="ev-date-list">
                        {group.events.map((dateEvent) => (
                          <li className="ev-date-row" key={`${dateEvent.partner}-${dateEvent.id}`}>
                            <div className="ev-date-copy">
                              <strong>{formatDate(dateEvent.date) || "Date to be announced"}</strong>
                              {group.isTeamGroup && dateEvent.name !== group.title && (
                                <span>{dateEvent.name}</span>
                              )}
                              <small>{[dateEvent.venue, dateEvent.city].filter(Boolean).join(", ")}</small>
                            </div>
                            <a
                              className="ev-ticket ev-ticket-small"
                              href={goLink(dateEvent.partner, dateEvent.url)}
                              rel="sponsored noopener noreferrer"
                              target="_blank"
                            >
                              Tickets <span aria-hidden="true">↗</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </>
                ) : (
                  <p className="ev-meta">{eventMeta(event)}</p>
                )}
              </div>

              {!recurring && (
                <a
                  className="ev-ticket"
                  href={goLink(event.partner, event.url)}
                  rel="sponsored noopener noreferrer"
                  target="_blank"
                >
                  Get tickets <span aria-hidden="true">↗</span>
                </a>
              )}
            </li>
          );
        })}
      </ul>

      {error && (
        <p role="alert" className="ev-error">
          {error}
        </p>
      )}

      {hasMore && (
        <div className="ev-more">
          <button type="button" onClick={loadMore} disabled={loading}>
            {loading ? "Loading events..." : "Load more events"}
          </button>
        </div>
      )}
    </div>
  );
}
