"use client";

import { useMemo, useState } from "react";
import type { ItineraryStop } from "@/lib/itinerary";

type Props = { stops: ItineraryStop[]; partySize: number; routeMiles?: number };

function nonNegative(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}
function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default function BudgetSummary({ stops, partySize, routeMiles = 0 }: Props) {
  const [fuelEfficiency, setFuelEfficiency] = useState("25");
  const [fuelPrice, setFuelPrice] = useState("3.50");
  const [mealEstimate, setMealEstimate] = useState("25");
  const [lodgingPerNight, setLodgingPerNight] = useState("140");
  const [nights, setNights] = useState("0");
  const [extraVehicleCosts, setExtraVehicleCosts] = useState("0");

  const values = useMemo(() => {
    const mpg = Math.max(0.1, nonNegative(fuelEfficiency, 25));
    const gas = nonNegative(fuelPrice, 3.5);
    const meal = nonNegative(mealEstimate, 25);
    const lodging = nonNegative(lodgingPerNight, 140) * nonNegative(nights, 0);
    const fuel = (Math.max(0, routeMiles) / mpg) * gas;
    const food = meal * Math.max(1, partySize);
    const vehicle = fuel + lodging + nonNegative(extraVehicleCosts, 0);
    const sourceProvidedCount = stops.filter((stop) => stop.costStatus === "source-provided").length;
    const sourceProvided = stops.reduce((total, stop) => {
      if (stop.costStatus !== "source-provided") return total;
      return total + (stop.costPerPerson ?? 0) * Math.max(1, partySize) + (stop.costPerVehicle ?? 0);
    }, 0);
    const estimated = food + vehicle + stops.reduce((total, stop) => {
      if (stop.costStatus !== "user-estimate") return total;
      return total + (stop.costPerPerson ?? 0) * Math.max(1, partySize) + (stop.costPerVehicle ?? 0);
    }, 0);
    const unknownCount = stops.filter((stop) => stop.costStatus === "unknown").length;
    return { sourceProvided, sourceProvidedCount, estimated, fuel, food, lodging, vehicle, unknownCount };
  }, [stops, partySize, routeMiles, fuelEfficiency, fuelPrice, mealEstimate, lodgingPerNight, nights, extraVehicleCosts]);

  return (
    <section className="ag-budget" aria-labelledby="ag-budget-title">
      <div className="ag-budget-head">
        <div>
          <h3 id="ag-budget-title">Preliminary trip budget</h3>
          <p>Estimates are editable planning assumptions, not provider quotes.</p>
        </div>
        <span>{values.unknownCount} stop cost{values.unknownCount === 1 ? "" : "s"} unconfirmed</span>
      </div>
      <div className="ag-budget-totals">
        <div><span>Source-provided costs</span><strong>{values.sourceProvidedCount ? money(values.sourceProvided) : "None supplied"}</strong></div>
        <div><span>Your estimates + trip expenses</span><strong>{money(values.estimated)}</strong></div>
        <div><span>Known + estimated subtotal</span><strong>{money(values.sourceProvided + values.estimated)}</strong></div>
      </div>
      <div className="ag-budget-inputs">
        <label>Vehicle efficiency (MPG)<input type="number" min="0.1" step="0.1" value={fuelEfficiency} onChange={(e) => setFuelEfficiency(e.target.value)} /></label>
        <label>Fuel price ($/gallon)<input type="number" min="0" step="0.01" value={fuelPrice} onChange={(e) => setFuelPrice(e.target.value)} /></label>
        <label>Meals ($/person)<input type="number" min="0" step="1" value={mealEstimate} onChange={(e) => setMealEstimate(e.target.value)} /></label>
        <label>Lodging ($/night)<input type="number" min="0" step="1" value={lodgingPerNight} onChange={(e) => setLodgingPerNight(e.target.value)} /></label>
        <label>Nights<input type="number" min="0" step="1" value={nights} onChange={(e) => setNights(e.target.value)} /></label>
        <label>Other vehicle costs ($)<input type="number" min="0" step="1" value={extraVehicleCosts} onChange={(e) => setExtraVehicleCosts(e.target.value)} /></label>
      </div>
      <p className="ag-budget-detail">Estimated fuel: {money(values.fuel)} for {Math.round(routeMiles).toLocaleString()} route miles · Estimated meals: {money(values.food)} · Lodging: {money(values.lodging)}</p>
      <p className="ag-budget-disclosure">Ticket prices, taxes, fees, parking, and reservation availability are not assumed to be free when unknown. The subtotal excludes unconfirmed prices, return-trip mileage, and any costs you have not entered.</p>
    </section>
  );
}
