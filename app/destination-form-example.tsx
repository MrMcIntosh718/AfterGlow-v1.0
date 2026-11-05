import CityAutocomplete from "@/components/CityAutocomplete";

export default function DestinationForm() {
  return (
    <form action="/search" method="GET" className="destination-form">
      <CityAutocomplete name="city" label="Destination" required />
      <button type="submit">Search events</button>
    </form>
  );
}
