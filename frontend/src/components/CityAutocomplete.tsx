import React, { useState, useEffect, useRef, useMemo } from "react";
import { MapPin, Loader2, X, ChevronDown, Building2 } from "lucide-react";
import { searchLocations, LocationSuggestion } from "../services/api";

interface CityAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string, suggestion?: LocationSuggestion) => void;
  placeholder?: string;
  country?: string;
  required?: boolean;
}

// Curated top freight and logistics hubs per region for instant 1-click driver selection
const REGIONAL_HUBS: Record<string, LocationSuggestion[]> = {
  US: [
    { city: "Chicago", state: "IL", country: "United States", country_code: "US", label: "Chicago, IL, USA", display_name: "Chicago, Illinois, United States", lat: 41.8781, lon: -87.6298 },
    { city: "Dallas", state: "TX", country: "United States", country_code: "US", label: "Dallas, TX, USA", display_name: "Dallas, Texas, United States", lat: 32.7767, lon: -96.7970 },
    { city: "Atlanta", state: "GA", country: "United States", country_code: "US", label: "Atlanta, GA, USA", display_name: "Atlanta, Georgia, United States", lat: 33.7490, lon: -84.3880 },
    { city: "Denver", state: "CO", country: "United States", country_code: "US", label: "Denver, CO, USA", display_name: "Denver, Colorado, United States", lat: 39.7392, lon: -104.9903 },
    { city: "Seattle", state: "WA", country: "United States", country_code: "US", label: "Seattle, WA, USA", display_name: "Seattle, Washington, United States", lat: 47.6062, lon: -122.3321 },
    { city: "Los Angeles", state: "CA", country: "United States", country_code: "US", label: "Los Angeles, CA, USA", display_name: "Los Angeles, California, United States", lat: 34.0522, lon: -118.2437 },
    { city: "Houston", state: "TX", country: "United States", country_code: "US", label: "Houston, TX, USA", display_name: "Houston, Texas, United States", lat: 29.7604, lon: -95.3698 },
    { city: "Kansas City", state: "MO", country: "United States", country_code: "US", label: "Kansas City, MO, USA", display_name: "Kansas City, Missouri, United States", lat: 39.0997, lon: -94.5786 },
    { city: "St. Louis", state: "MO", country: "United States", country_code: "US", label: "St. Louis, MO, USA", display_name: "St. Louis, Missouri, United States", lat: 38.6270, lon: -90.1994 },
    { city: "Minneapolis", state: "MN", country: "United States", country_code: "US", label: "Minneapolis, MN, USA", display_name: "Minneapolis, Minnesota, United States", lat: 44.9778, lon: -93.2650 },
    { city: "Indianapolis", state: "IN", country: "United States", country_code: "US", label: "Indianapolis, IN, USA", display_name: "Indianapolis, Indiana, United States", lat: 39.7684, lon: -86.1581 },
    { city: "Memphis", state: "TN", country: "United States", country_code: "US", label: "Memphis, TN, USA", display_name: "Memphis, Tennessee, United States", lat: 35.1495, lon: -90.0490 },
    { city: "Phoenix", state: "AZ", country: "United States", country_code: "US", label: "Phoenix, AZ, USA", display_name: "Phoenix, Arizona, United States", lat: 33.4484, lon: -112.0740 },
    { city: "Detroit", state: "MI", country: "United States", country_code: "US", label: "Detroit, MI, USA", display_name: "Detroit, Michigan, United States", lat: 42.3314, lon: -83.0458 },
    { city: "Miami", state: "FL", country: "United States", country_code: "US", label: "Miami, FL, USA", display_name: "Miami, Florida, United States", lat: 25.7617, lon: -80.1918 },
    { city: "New York", state: "NY", country: "United States", country_code: "US", label: "New York, NY, USA", display_name: "New York, New York, United States", lat: 40.7128, lon: -74.0060 },
  ],
  IN: [
    { city: "Delhi", state: "Delhi", country: "India", country_code: "IN", label: "Delhi, India", display_name: "Delhi, India", lat: 28.6139, lon: 77.2090 },
    { city: "Mumbai", state: "Maharashtra", country: "India", country_code: "IN", label: "Mumbai, Maharashtra, India", display_name: "Mumbai, Maharashtra, India", lat: 19.0760, lon: 72.8777 },
    { city: "Bengaluru", state: "Karnataka", country: "India", country_code: "IN", label: "Bengaluru, Karnataka, India", display_name: "Bengaluru, Karnataka, India", lat: 12.9716, lon: 77.5946 },
    { city: "Chennai", state: "Tamil Nadu", country: "India", country_code: "IN", label: "Chennai, Tamil Nadu, India", display_name: "Chennai, Tamil Nadu, India", lat: 13.0827, lon: 80.2707 },
    { city: "Kolkata", state: "West Bengal", country: "India", country_code: "IN", label: "Kolkata, West Bengal, India", display_name: "Kolkata, West Bengal, India", lat: 22.5726, lon: 88.3639 },
    { city: "Hyderabad", state: "Telangana", country: "India", country_code: "IN", label: "Hyderabad, Telangana, India", display_name: "Hyderabad, Telangana, India", lat: 17.3850, lon: 78.4867 },
    { city: "Pune", state: "Maharashtra", country: "India", country_code: "IN", label: "Pune, Maharashtra, India", display_name: "Pune, Maharashtra, India", lat: 18.5204, lon: 73.8567 },
    { city: "Ahmedabad", state: "Gujarat", country: "India", country_code: "IN", label: "Ahmedabad, Gujarat, India", display_name: "Ahmedabad, Gujarat, India", lat: 23.0225, lon: 72.5714 },
    { city: "Kanpur", state: "Uttar Pradesh", country: "India", country_code: "IN", label: "Kanpur, Uttar Pradesh, India", display_name: "Kanpur, Uttar Pradesh, India", lat: 26.4499, lon: 80.3319 },
    { city: "Lucknow", state: "Uttar Pradesh", country: "India", country_code: "IN", label: "Lucknow, Uttar Pradesh, India", display_name: "Lucknow, Uttar Pradesh, India", lat: 26.8467, lon: 80.9462 },
  ],
  CA: [
    { city: "Toronto", state: "ON", country: "Canada", country_code: "CA", label: "Toronto, ON, Canada", display_name: "Toronto, Ontario, Canada", lat: 43.6532, lon: -79.3832 },
    { city: "Vancouver", state: "BC", country: "Canada", country_code: "CA", label: "Vancouver, BC, Canada", display_name: "Vancouver, British Columbia, Canada", lat: 49.2827, lon: -123.1207 },
    { city: "Montreal", state: "QC", country: "Canada", country_code: "CA", label: "Montreal, QC, Canada", display_name: "Montreal, Quebec, Canada", lat: 45.5017, lon: -73.5673 },
    { city: "Calgary", state: "AB", country: "Canada", country_code: "CA", label: "Calgary, AB, Canada", display_name: "Calgary, Alberta, Canada", lat: 51.0447, lon: -114.0719 },
  ],
  GB: [
    { city: "London", state: "England", country: "United Kingdom", country_code: "GB", label: "London, UK", display_name: "London, England, United Kingdom", lat: 51.5074, lon: -0.1278 },
    { city: "Birmingham", state: "England", country: "United Kingdom", country_code: "GB", label: "Birmingham, UK", display_name: "Birmingham, England, United Kingdom", lat: 52.4862, lon: -1.8904 },
    { city: "Manchester", state: "England", country: "United Kingdom", country_code: "GB", label: "Manchester, UK", display_name: "Manchester, England, United Kingdom", lat: 53.4808, lon: -2.2426 },
  ],
  DE: [
    { city: "Frankfurt", state: "Hessen", country: "Germany", country_code: "DE", label: "Frankfurt, Germany", display_name: "Frankfurt am Main, Hessen, Germany", lat: 50.1109, lon: 8.6821 },
    { city: "Berlin", state: "Berlin", country: "Germany", country_code: "DE", label: "Berlin, Germany", display_name: "Berlin, Germany", lat: 52.5200, lon: 13.4050 },
    { city: "Hamburg", state: "Hamburg", country: "Germany", country_code: "DE", label: "Hamburg, Germany", display_name: "Hamburg, Germany", lat: 53.5511, lon: 9.9937 },
    { city: "Munich", state: "Bavaria", country: "Germany", country_code: "DE", label: "Munich, Germany", display_name: "Munich, Bavaria, Germany", lat: 48.1351, lon: 11.5820 },
  ],
  AU: [
    { city: "Sydney", state: "NSW", country: "Australia", country_code: "AU", label: "Sydney, NSW, Australia", display_name: "Sydney, New South Wales, Australia", lat: -33.8688, lon: 151.2093 },
    { city: "Melbourne", state: "VIC", country: "Australia", country_code: "AU", label: "Melbourne, VIC, Australia", display_name: "Melbourne, Victoria, Australia", lat: -37.8136, lon: 144.9631 },
    { city: "Brisbane", state: "QLD", country: "Australia", country_code: "AU", label: "Brisbane, QLD, Australia", display_name: "Brisbane, Queensland, Australia", lat: -27.4698, lon: 153.0251 },
  ],
};

export const CityAutocomplete: React.FC<CityAutocompleteProps> = ({
  label,
  value,
  onChange,
  placeholder = "Select or search city / transport hub...",
  country = "US",
  required = false,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [apiSuggestions, setApiSuggestions] = useState<LocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);
  const lastSelectedTextRef = useRef<string>(value || "");

  // Available hubs for current region
  const regionalHubs = useMemo(() => {
    const list = REGIONAL_HUBS[country] || REGIONAL_HUBS["US"];
    return list;
  }, [country]);

  // Sync internal input value if prop changes from outside (e.g. reset or swap)
  useEffect(() => {
    setInputValue(value);
    lastSelectedTextRef.current = value;
  }, [value]);

  // Filter local regional hubs instantly based on current query
  const filteredLocalHubs = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return regionalHubs;
    return regionalHubs.filter(
      (h) =>
        h.city.toLowerCase().includes(q) ||
        (h.state && h.state.toLowerCase().includes(q)) ||
        h.label.toLowerCase().includes(q) ||
        h.display_name.toLowerCase().includes(q)
    );
  }, [inputValue, regionalHubs]);

  // Merged suggestions: local hubs first, followed by unique API results
  const combinedSuggestions = useMemo(() => {
    if (!inputValue || inputValue.trim() === lastSelectedTextRef.current.trim()) {
      return regionalHubs;
    }
    const localKeys = new Set(filteredLocalHubs.map((h) => `${h.lat.toFixed(2)},${h.lon.toFixed(2)}`));
    const extraApi = apiSuggestions.filter(
      (a) => !localKeys.has(`${a.lat.toFixed(2)},${a.lon.toFixed(2)}`)
    );
    return [...filteredLocalHubs, ...extraApi];
  }, [inputValue, regionalHubs, filteredLocalHubs, apiSuggestions]);

  // Debounced search logic for additional geocoded locations
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = inputValue.trim();
    // Don't search if text exactly matches what user just selected
    if (!trimmed || trimmed === lastSelectedTextRef.current.trim() || trimmed.length < 2) {
      setApiSuggestions([]);
      setIsLoading(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchLocations(trimmed, country);
        setApiSuggestions(results);
        setHighlightedIndex(-1);
      } catch (e) {
        setApiSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputValue, country]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (item: LocationSuggestion) => {
    const selectedText = item.display_name || item.label;
    lastSelectedTextRef.current = selectedText;
    setInputValue(selectedText);
    onChange(selectedText, item);
    setIsOpen(false);
    setApiSuggestions([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setInputValue(nextVal);
    onChange(nextVal);
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || combinedSuggestions.length === 0) {
      if (e.key === "ArrowDown") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < combinedSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : combinedSuggestions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < combinedSuggestions.length) {
        handleSelect(combinedSuggestions[highlightedIndex]);
      } else if (combinedSuggestions.length > 0) {
        handleSelect(combinedSuggestions[0]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-slate-700" />
          <span>{label}</span>
        </span>
        {isLoading && (
          <span className="flex items-center gap-1 text-[10px] text-sky-600 font-medium font-mono">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Searching...</span>
          </span>
        )}
      </label>

      <div className="relative flex items-center">
        <input
          type="text"
          required={required}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
          }}
          onClick={() => {
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl pl-3 pr-14 py-2 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-2xs cursor-text"
        />

        <div className="absolute right-2 flex items-center space-x-1">
          {inputValue ? (
            <button
              type="button"
              onClick={() => {
                lastSelectedTextRef.current = "";
                setInputValue("");
                onChange("");
                setApiSuggestions([]);
                setIsOpen(true);
              }}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition"
            title="Toggle city list"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Direct Selection Dropdown Menu */}
      {isOpen && combinedSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xl z-[9999] overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-100 animate-in fade-in duration-100">
          {/* Header indicating regional direct-select options */}
          <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center justify-between sticky top-0 z-10 border-b border-slate-100">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" />
              <span>{inputValue && inputValue !== lastSelectedTextRef.current ? "Search Results" : `Freight Transport Hubs (${country})`}</span>
            </span>
            <span className="font-mono text-[9px] text-slate-400">{combinedSuggestions.length} Available</span>
          </div>

          {combinedSuggestions.map((item, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <div
                key={`${item.lat}-${item.lon}-${idx}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition ${
                  isHighlighted ? "bg-blue-50 text-blue-900" : "hover:bg-slate-50 text-slate-800"
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      isHighlighted ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                  </div>
                  <div className="truncate">
                    <div className="font-bold truncate text-[11px] text-slate-900">{item.label}</div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {item.display_name}
                    </div>
                  </div>
                </div>

                {item.country_code && (
                  <span className="shrink-0 ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-slate-100 text-slate-600 border border-slate-200">
                    {item.country_code}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
