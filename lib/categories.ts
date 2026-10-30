// Shared list of event categories. The `value` is sent to Ticketmaster as
// `classificationName`, so keep it to names Ticketmaster recognizes.
export const EVENT_CATEGORIES = [
  { value: "Music", label: "Music" },
  { value: "Sports", label: "Sports" },
  { value: "Arts & Theatre", label: "Theater & comedy" },
  { value: "Family", label: "Family" },
] as const;

export function isEventCategory(value: string): boolean {
  return EVENT_CATEGORIES.some((category) => category.value === value);
}
