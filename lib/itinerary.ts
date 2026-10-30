export type ItineraryStop = {
  id: string;
  title: string;
  kind: "event" | "attraction" | "custom";
  latitude?: number;
  longitude?: number;
  locationLabel?: string;
  date?: string;
  visitDurationMinutes: number;
  startTime?: string;
  costPerPerson?: number;
  costPerVehicle?: number;
  currency?: string;
  costStatus: "source-provided" | "user-estimate" | "unknown";
};

export type RouteLeg = {
  fromId: string;
  toId: string;
  distanceKm?: number;
  durationMinutes?: number;
  state: "available" | "unavailable";
  source: string;
};

export type TimingCheck = {
  warnings: string[];
  conflicts: string[];
};

export function evaluateItineraryTiming(stops: ItineraryStop[]): TimingCheck {
  const warnings: string[] = [];
  const conflicts: string[] = [];
  stops.forEach((stop, index) => {
    if (!Number.isFinite(stop.visitDurationMinutes) || stop.visitDurationMinutes <= 0) {
      warnings.push(`“${stop.title}” needs a visit duration greater than zero.`);
    }
    if (!Number.isFinite(stop.latitude) || !Number.isFinite(stop.longitude)) {
      warnings.push(`Travel time to or from “${stop.title}” cannot be calculated because its coordinates are unavailable.`);
    }
    if (!stop.date) warnings.push(`“${stop.title}” has no assigned visit date.`);
    if (stop.costStatus === "unknown") warnings.push(`Cost for “${stop.title}” is unconfirmed.`);
    if (stop.startTime && stop.date && stop.visitDurationMinutes > 0) {
      const start = parseMinutes(stop.startTime);
      if (start === null) warnings.push(`Start time for “${stop.title}” is invalid.`);
      else if (start + stop.visitDurationMinutes > 24 * 60) {
        warnings.push(`“${stop.title}” runs past midnight; confirm the venue schedule.`);
      }
    }
    const previousDate = index > 0 ? stops[index - 1].date : undefined;
    if (stop.date && previousDate && stop.date < previousDate) {
      warnings.push(`“${stop.title}” is scheduled before the previous stop. Check the stop order.`);
    }
  });

  const scheduled = stops
    .filter((stop) => stop.date && stop.startTime && stop.visitDurationMinutes > 0)
    .filter((stop) => !!stop.startTime).map((stop) => ({ stop, start: parseMinutes(stop.startTime!) }))
    .filter((item): item is { stop: ItineraryStop; start: number } => item.start !== null)
    .sort((a, b) => a.stop.date!.localeCompare(b.stop.date!) || a.start - b.start);

  for (let i = 1; i < scheduled.length; i++) {
    const previous = scheduled[i - 1];
    const current = scheduled[i];
    if (previous.stop.date === current.stop.date &&
        current.start < previous.start + previous.stop.visitDurationMinutes) {
      conflicts.push(`“${current.stop.title}” overlaps “${previous.stop.title}” on ${current.stop.date}. Driving time between them is not included in this overlap check.`);
    }
  }
  return { warnings: [...new Set(warnings)], conflicts };
}

function parseMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]), minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}
