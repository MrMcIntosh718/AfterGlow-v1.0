"use client";

import { useEffect, useState } from "react";
import { EVENT_CATEGORIES } from "@/lib/categories";
import "./events-ui.css";

const RADIUS_OPTIONS = [10, 25, 50, 100, 250];

type SearchFiltersProps = {
  initialFrom?: string;
  initialTo?: string;
  initialRadius?: number;
  initialCategory?: string;
};

// Rendered inside the search <form>, so every field here is submitted with it.
export default function SearchFilters({
  initialFrom = "",
  initialTo = "",
  initialRadius = 25,
  initialCategory = "",
}: SearchFiltersProps) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [category, setCategory] = useState(initialCategory);
  const [radius, setRadius] = useState(initialRadius);

  // Keep internal state in sync when the URL/search params change (e.g. browser
  // back/forward or a new search), since these fields are otherwise uncontrolled.
  useEffect(() => setFrom(initialFrom), [initialFrom]);
  useEffect(() => setTo(initialTo), [initialTo]);
  useEffect(() => setCategory(initialCategory), [initialCategory]);
  useEffect(() => setRadius(initialRadius), [initialRadius]);

  const radiusOptions = RADIUS_OPTIONS.includes(radius)
    ? RADIUS_OPTIONS
    : [...RADIUS_OPTIONS, radius].sort((a, b) => a - b);

  return (
    <div className="ev-filters">
      <label className="ev-filter">
        <span>From</span>
        <input
          type="date"
          name="from"
          value={from}
          onChange={(event) => {
            const next = event.target.value;
            setFrom(next);
            // Keep the end date from falling before the start date.
            if (next && to && next > to) setTo(next);
          }}
        />
      </label>

      <label className="ev-filter">
        <span>To</span>
        <input
          type="date"
          name="to"
          value={to}
          min={from || undefined}
          onChange={(event) => setTo(event.target.value)}
        />
      </label>

      <button
        type="button"
        className="ev-clear"
        disabled={!from && !to}
        onClick={() => {
          setFrom("");
          setTo("");
        }}
      >
        Clear dates
      </button>

      <label className="ev-filter">
        <span>Category</span>
        <select name="category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {EVENT_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </label>

      <label className="ev-filter">
        <span>Distance · expand if needed</span>
        <select name="radius" value={String(radius)} onChange={(e) => setRadius(Number(e.target.value))}>
          {radiusOptions.map((miles) => (
            <option key={miles} value={miles}>
              Within {miles} miles
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
