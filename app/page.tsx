import { searchEvents } from "@/lib/partners";
import { isEventCategory } from "@/lib/categories";
import { publicMessage } from "@/lib/errors";
import CityAutocomplete from "@/components/CityAutocomplete";
import SearchFilters from "@/components/search-filters";
import EventResults from "@/components/event-results";

type SearchParams = Promise<{
    q?: string;
    city?: string;
    from?: string;
    to?: string;
    date?: string; // legacy single date, still accepted
    category?: string;
    radius?: string;
}>;

// Fixed locale and UTC so the text is the same on server and client.
function formatDate(value: string) {
    const parsed = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    });
}

function describeRange(from: string, to: string) {
    if (from && to) {
        return from === to
            ? `on ${formatDate(from)}`
            : `from ${formatDate(from)} to ${formatDate(to)}`;
    }
    if (from) return `from ${formatDate(from)} onward`;
    if (to) return `through ${formatDate(to)}`;
    return "";
}

export default async function Home({
    searchParams,
}: {
    searchParams: SearchParams;
}) {
    const {
        q = "",
        city = "",
        from: fromParam = "",
        to: toParam = "",
        date: legacyDate = "",
        category: categoryParam = "",
        radius: radiusParam = "25",
    } = await searchParams;

    // Old links used a single ?date=; treat it as a one-day range.
    const from = fromParam || (toParam ? "" : legacyDate);
    const to = toParam || (fromParam ? "" : legacyDate);
    const category = isEventCategory(categoryParam) ? categoryParam : "";

    const parsedRadius = Number(radiusParam);
    const radius = Number.isFinite(parsedRadius)
        ? Math.min(250, Math.max(10, Math.round(parsedRadius)))
        : 25;

    const hasSearch = Boolean(q.trim() || city.trim());
    const rangeText = describeRange(from, to);

    let events: Awaited<ReturnType<typeof searchEvents>>["events"] = [];
    let hasMore = false;
    let searchError = "";

    if (hasSearch) {
        try {
            ({ events, hasMore } = await searchEvents(q.trim(), city.trim() || undefined, {
                from: from || undefined,
                to: to || undefined,
                category: category || undefined,
                radius: city.trim() ? radius : undefined,
                page: 0,
            }));
        } catch (error) {
            // A provider outage must not look like "no events found".
            console.error("Home search failed:", error);
            searchError = publicMessage(error);
        }
    }

    return (
        <>
            <section className="hero">
                <div className="hero-orb hero-orb-one" aria-hidden="true" />
                <div className="hero-orb hero-orb-two" aria-hidden="true" />

                <div className="hero-content">
                    <div className="eyebrow">
                        <span className="eyebrow-dot" />
                        YOUR NEXT UNFORGETTABLE MOMENT
                    </div>

                    <h1>
                        Make room for
                        <br />
                        <span>live.</span>
                    </h1>

                    <p className="hero-copy">
                        Discover the concerts, games, and shows you’ll be talking about
                        long after the lights go down.
                    </p>

                    <form action="/" method="get" className="search-panel">
                        <label className="search-field event-field">
                            <span className="field-icon" aria-hidden="true">
                                ♫
                            </span>
                            <span className="field-stack">
                                <span className="field-label">WHAT ARE YOU INTO?</span>
                                <input
                                    name="q"
                                    defaultValue={q}
                                    placeholder="Artist, team, or event"
                                    autoComplete="off"
                                    aria-label="Artist, team, or event"
                                />
                            </span>
                        </label>

                        <span className="search-divider" aria-hidden="true" />

                        <div className="search-field city-field">
                            <span className="field-icon pin-icon" aria-hidden="true">
                                ⌖
                            </span>
                            <span className="field-stack">
                                <span className="field-label">WHERE'S THE ACTION?</span>
                                <CityAutocomplete initialValue={city} />
                            </span>
                        </div>

                        <button className="search-button" type="submit">
                            Find tickets <span aria-hidden="true">↗</span>
                        </button>

                        <SearchFilters
                            initialFrom={from}
                            initialTo={to}
                            initialRadius={radius}
                            initialCategory={category}
                        />
                    </form>

                    <div className="hero-footnote">
                        <span aria-hidden="true">✦</span> Find your people. Feel the
                        moment.
                    </div>
                </div>

                <div className="hero-side-note" aria-hidden="true">
                    GOOD NIGHTS. GREAT STORIES.
                </div>
            </section>

            <section className="discovery" aria-label="Explore events">
                <div className="section-heading">
                    <div>
                        <p className="section-kicker">YOUR PLANS START HERE</p>
                        <h2>
                            {q.trim()
                                ? `Results for “${q}”`
                                : city.trim()
                                    ? `Events near ${city}`
                                    : "What moves you?"}
                        </h2>
                    </div>

                    <p className="section-note">
                        {city.trim()
                            ? `Searching within ${radius} miles of ${city}${rangeText ? ` ${rangeText}` : ""}`
                            : q.trim()
                                ? rangeText
                                    ? `Matching events ${rangeText}`
                                    : "Explore matching events"
                                : "Big names. Home-team energy. One-of-a-kind nights."}
                    </p>
                </div>

                {!hasSearch && (
                    <div className="category-grid">
                        <a className="category-card category-concerts" href="/?q=concerts">
                            <span className="category-symbol" aria-hidden="true">♫</span>
                            <span className="category-name">Concerts</span>
                            <span className="category-arrow" aria-hidden="true">↗</span>
                        </a>

                        <a className="category-card category-sports" href="/?q=sports">
                            <span className="category-symbol" aria-hidden="true">◉</span>
                            <span className="category-name">Sports</span>
                            <span className="category-arrow" aria-hidden="true">↗</span>
                        </a>

                        <a className="category-card category-theater" href="/?q=theater">
                            <span className="category-symbol" aria-hidden="true">✳</span>
                            <span className="category-name">Theater & comedy</span>
                            <span className="category-arrow" aria-hidden="true">↗</span>
                        </a>
                    </div>
                )}

                {hasSearch && searchError && (
                    <div className="empty-state" role="alert">
                        <div className="empty-icon" aria-hidden="true">!</div>
                        <h3>We couldn’t load events right now</h3>
                        <p>{searchError}</p>
                        <a className="text-link" href={`/?${new URLSearchParams({ q, city }).toString()}`}>
                            Try again <span aria-hidden="true">→</span>
                        </a>
                    </div>
                )}

                {hasSearch && !searchError && events.length === 0 && !hasMore && (
                    <div className="empty-state">
                        <div className="empty-icon" aria-hidden="true">⌕</div>
                        <h3>No events found just yet</h3>
                        <p>
                            Try a different artist, team, city, or date range. If this is a
                            fresh setup, confirm that <code>TICKETMASTER_API_KEY</code> and
                            <code> NEXT_PUBLIC_MAPBOX_TOKEN</code> are set in
                            <code> .env.local</code>.
                        </p>
                        <a className="text-link" href="/">
                            Explore event categories <span aria-hidden="true">→</span>
                        </a>
                    </div>
                )}

                {hasSearch && !searchError && events.length === 0 && hasMore && (
                    <div className="empty-state">
                        <h3>Still looking for your events</h3>
                        <p>Try loading the next page of results.</p>
                    </div>
                )}

                {hasSearch && (events.length > 0 || hasMore) && (
                    <EventResults
                        key={`${q}|${city}|${from}|${to}|${category}|${radius}`}
                        initialEvents={events}
                        initialHasMore={hasMore}
                        query={q.trim()}
                        city={city.trim()}
                        from={from}
                        to={to}
                        category={category}
                        radius={radius}
                    />
                )}
            </section>
        </>
    );
}
