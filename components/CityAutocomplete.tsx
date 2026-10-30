"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import "./CityAutocomplete.css";

export type CitySuggestion = {
    id: string;
    name: string;
    region: string;
    country: string;
    displayName: string;
};

type CityAutocompleteProps = {
    initialValue?: string;
    /** Optional controlled value. When provided, the parent is the source of truth. */
    value?: string;
    name?: string;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    onValueChange?: (value: string) => void;
    onCitySelect?: (city: CitySuggestion | null) => void;
};

export default function CityAutocomplete({
    initialValue = "",
    value: controlledValue,
    name = "city",
    label = "City or destination",
    required = false,
    disabled = false,
    onValueChange,
    onCitySelect,
}: CityAutocompleteProps) {
    const id = useId();
    const inputId = `${id}-input`;
    const listId = `${id}-suggestions`;

    const [value, setValue] = useState(initialValue);
    const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [selectedFromSuggestions, setSelectedFromSuggestions] =
        useState(false);
    const [loading, setLoading] = useState(false);

    const rootRef = useRef<HTMLDivElement>(null);

    // initialValue is an initial seed, not a controlled value. The parent is
    // notified on each keystroke; syncing it back here would reset the caret
    // on every character and make editing in the middle of a word difficult.

    const currentValue = controlledValue ?? value;

    useEffect(() => {
        const query = currentValue.trim();

        const isZipCode = /^\d{5}$/.test(query);

        if (selectedFromSuggestions || query.length < 2 || disabled || isZipCode) {
            setSuggestions([]);
            setLoading(false);
            if (isZipCode) setIsOpen(false);
            return;
        }

        const controller = new AbortController();

        const timeout = window.setTimeout(async () => {
            setLoading(true);

            try {
                const response = await fetch(
                    `/api/locations?q=${encodeURIComponent(query)}`,
                    { signal: controller.signal }
                );

                if (!response.ok) {
                    throw new Error("Could not load city suggestions.");
                }

                const data = (await response.json()) as {
                    suggestions?: CitySuggestion[];
                };

                // A response may finish parsing just as the user types again.
                // Never let an aborted, older query replace the latest suggestions.
                if (controller.signal.aborted) return;
                setSuggestions(data.suggestions ?? []);
                setIsOpen(true);
                setActiveIndex(-1);
            } catch (error) {
                if (error instanceof Error && error.name === "AbortError") {
                    return;
                }

                setSuggestions([]);
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }, 250);

        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [currentValue, selectedFromSuggestions, disabled]);

    useEffect(() => {
        function handleOutsidePointer(event: PointerEvent) {
            if (
                event.target instanceof Node &&
                rootRef.current &&
                !rootRef.current.contains(event.target)
            ) {
                setIsOpen(false);
                setActiveIndex(-1);
            }
        }

        document.addEventListener("pointerdown", handleOutsidePointer);

        return () => {
            document.removeEventListener("pointerdown", handleOutsidePointer);
        };
    }, []);

    function chooseCity(city: CitySuggestion) {
        setValue(city.displayName);
        setSelectedFromSuggestions(true);
        setSuggestions([]);
        setIsOpen(false);
        setActiveIndex(-1);

        onValueChange?.(city.displayName);
        onCitySelect?.(city);
    }

    function handleChange(nextValue: string) {
        setValue(nextValue);
        setSelectedFromSuggestions(false);
        setIsOpen(nextValue.trim().length >= 2);
        setActiveIndex(-1);

        onValueChange?.(nextValue);
        onCitySelect?.(null);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.nativeEvent.isComposing) return;

        if (event.key === "Escape") {
            setIsOpen(false);
            setActiveIndex(-1);
            return;
        }

        if (!suggestions.length) return;

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setIsOpen(true);
            setActiveIndex((current) =>
                current < suggestions.length - 1 ? current + 1 : 0
            );
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setIsOpen(true);
            setActiveIndex((current) =>
                current > 0 ? current - 1 : suggestions.length - 1
            );
        } else if (event.key === "Enter" && isOpen && activeIndex >= 0) {
            event.preventDefault();
            chooseCity(suggestions[activeIndex]);
        }
    }

    const expanded = isOpen && suggestions.length > 0 && !disabled;

    return (
        <div className="city-autocomplete" ref={rootRef}>
            {label !== "City or destination" && (
                <label className="city-label" htmlFor={inputId}>
                    {label}
                    {required && <span aria-hidden="true"> *</span>}
                </label>
            )}

            <div className="city-input-wrap">
                <input
                    id={inputId}
                    className="city-input"
                    type="text"
                    name={name}
                    value={controlledValue ?? value}
                    onChange={(event) => handleChange(event.target.value)}
                    onFocus={() => {
                        if (suggestions.length) setIsOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="City, state, or ZIP code"
                    autoComplete="off"
                    inputMode="search"
                    required={required}
                    disabled={disabled}
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={expanded}
                    aria-controls={expanded ? listId : undefined}
                    aria-activedescendant={
                        expanded && activeIndex >= 0
                            ? `${listId}-${activeIndex}`
                            : undefined
                    }
                    aria-label={label}
                />

                {expanded && (
                    <ul
                        className="city-suggestions"
                        id={listId}
                        role="listbox"
                        aria-label="City and state suggestions"
                    >
                        {suggestions.map((city, index) => (
                            <li
                                key={city.id}
                                id={`${listId}-${index}`}
                                role="option"
                                aria-selected={index === activeIndex}
                            >
                                <button
                                    type="button"
                                    className={`city-option${
                                        index === activeIndex ? " city-option-active" : ""
                                    }`}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onClick={() => chooseCity(city)}
                                >
                                    <span className="suggestion-pin" aria-hidden="true">
                                        ⌖
                                    </span>

                                    <span className="suggestion-copy">
                                        <span className="suggestion-name">{city.name}</span>
                                        <small>
                                            {[city.region, city.country].filter(Boolean).join(", ")}
                                        </small>
                                    </span>

                                    <span className="suggestion-arrow" aria-hidden="true">
                                        ↗
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {loading && (
                <span className="city-hint" role="status">
                    Finding cities…
                </span>
            )}

            {!loading && /^\d{5}$/.test(value.trim()) && (
                <span className="city-hint" role="status">
                    ZIP code ready — we’ll search nearby events first.
                </span>
            )}

            {!loading &&
                value.trim().length >= 2 &&
                !/^\d{5}$/.test(value.trim()) &&
                suggestions.length === 0 &&
                !selectedFromSuggestions && (
                    <span className="city-hint" role="status">
                        No suggestions found. Enter a city and state, or use a 5-digit ZIP code.
                    </span>
                )}
        </div>
    );
}
