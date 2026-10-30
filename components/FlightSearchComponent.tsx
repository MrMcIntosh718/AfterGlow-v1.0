"use client";

import { useState, useCallback } from "react";
import type { FlightSearchOptions } from "@/lib/partners/flights";
import { searchFlights } from "@/lib/partners/flights";

// Shape of a single flight card. Adjust to match your real API response.
interface Flight {
    airline?: string;
    origin: string;
    destination: string;
    price?: number | string;
}

interface FlightResults {
    flights: Flight[];
    hasMore: boolean;
}

/**
 * Component responsible for handling flight search inputs and displaying results.
 */
export default function FlightSearchComponent() {
    const [formData, setFormData] = useState<{
        origin: string;
        destination: string;
        date: string;
    }>({
        origin: "", // Should use IATA codes (e.g., JFK)
        destination: "",
        date: ""
    });

    const [searchResults, setSearchResults] = useState<FlightResults>({ flights: [], hasMore: false });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, []);

    const handleSearch = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.origin || !formData.destination || !formData.date) {
            setError("Please fill in Origin, Destination, and Departure Date.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const options: FlightSearchOptions = {
                origin: formData.origin.toUpperCase(),
                destination: formData.destination.toUpperCase(),
                departureDate: formData.date
            };

            const result = await searchFlights(options);

            setSearchResults(result as unknown as FlightResults);
        } catch (err) {
            setError("Failed to load flight data. Please check inputs and API keys.");
        } finally {
            setLoading(false);
        }
    }, [formData]);

    return (
        <div className="flight-search p-6 bg-gray-50 border rounded-xl shadow-inner">
            <h3 className="text-2xl font-bold mb-4 text-red-700 flex items-center gap-3">
                ✈️ Book Flights & Travel <span aria-hidden="true">↗</span>
            </h3>

            <form onSubmit={handleSearch} className="flex gap-4 p-4 border bg-white rounded-lg shadow-md mb-8">
                <div className="flex flex-col w-[20%]">
                    <label htmlFor="origin" className="text-sm font-medium mb-1 text-gray-600">Origin Airport (IATA)</label>
                    <input
                        id="origin"
                        name="origin"
                        type="text"
                        value={formData.origin}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., JFK"
                        className="p-3 border rounded focus:ring-red-500 focus:border-red-500"
                    />
                </div>

                <div className="flex flex-col w-[20%]">
                    <label htmlFor="destination" className="text-sm font-medium mb-1 text-gray-600">Destination Airport (IATA)</label>
                    <input
                        id="destination"
                        name="destination"
                        type="text"
                        value={formData.destination}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., LAX"
                        className="p-3 border rounded focus:ring-red-500 focus:border-red-500"
                    />
                </div>

                <div className="flex flex-col w-[20%]">
                    <label htmlFor="date" className="text-sm font-medium mb-1 text-gray-600">Departure Date</label>
                    <input
                        id="date"
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                        className="p-3 border rounded focus:ring-red-500 focus:border-red-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-[18%] py-3 px-4 text-white rounded transition duration-200 ${
                        loading ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                    }`}
                >
                    {loading ? "Searching..." : "Search Flights"}
                </button>
            </form>

            <div className="mt-8">
                {error && (
                    <p role="alert" className="text-red-600 p-3 bg-red-50 border border-red-200 rounded">
                        {error}
                    </p>
                )}

                {searchResults.flights.length > 0 && (
                    <>
                        <h4 className="text-xl font-semibold mb-3 text-green-700">
                            ✈️ Found Flight Options ({searchResults.flights.length})
                        </h4>
                        <div className="space-y-4">
                            {searchResults.flights.map((flight: Flight, index: number) => (
                                <div
                                    key={index}
                                    className="flex justify-between items-center p-4 border rounded-lg bg-white shadow hover:shadow-md transition duration-150"
                                >
                                    <div className="flex-grow">
                                        <p className="text-xl font-bold">
                                            {flight.airline || "Airline Name"}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            From {flight.origin} to {flight.destination}
                                        </p>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <p className="text-3xl font-extrabold text-red-600">
                                            {flight.price !== undefined ? `$${flight.price}` : "—"}
                                        </p>
                                        <button className="mt-1 text-sm text-blue-600 hover:underline">
                                            Select & Book
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
