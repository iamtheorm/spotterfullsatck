import React, { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, X, ChevronDown } from "lucide-react";
import { searchLocations, LocationSuggestion } from "../services/api";

interface CityAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string, suggestion?: LocationSuggestion) => void;
  placeholder?: string;
  country?: string;
  required?: boolean;
}

export const CityAutocomplete: React.FC<CityAutocompleteProps> = ({
  label,
  value,
  onChange,
  placeholder = "Search city or transport hub...",
  country = "ALL",
  required = false,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);

  // Sync internal input value if prop changes from outside (e.g. preset or swap)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Debounced search logic (300ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!inputValue || inputValue.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    // Only search if user typed something different than current prop value or actively focused
    debounceTimerRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchLocations(inputValue, country);
        setSuggestions(results);
        setHighlightedIndex(-1);
        if (results.length > 0) {
          setIsOpen(true);
        }
      } catch (e) {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

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
    setInputValue(selectedText);
    onChange(selectedText, item);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setInputValue(nextVal);
    onChange(nextVal);
    if (!isOpen && nextVal.trim().length >= 2) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "ArrowDown" && suggestions.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleSelect(suggestions[highlightedIndex]);
      } else if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
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
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
        />

        {inputValue ? (
          <button
            type="button"
            onClick={() => {
              setInputValue("");
              onChange("");
              setSuggestions([]);
              setIsOpen(false);
            }}
            className="absolute right-2 text-slate-400 hover:text-slate-700 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
        )}
      </div>

      {/* Floating Cascading Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-[9999] overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100">
          {suggestions.map((item, idx) => {
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
                <div className="flex items-center space-x-2 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      isHighlighted ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                  </div>
                  <div className="truncate">
                    <div className="font-bold truncate text-[11px]">{item.label}</div>
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
