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

// Curated top freight and logistics hubs per region (including cities across all 50 US states)
const REGIONAL_HUBS: Record<string, LocationSuggestion[]> = {
  US: [
    { city: "Chicago", state: "IL", country: "United States", country_code: "US", label: "Chicago, IL, USA", display_name: "Chicago, Illinois, United States", lat: 41.8781, lon: -87.6298 },
    { city: "Dallas", state: "TX", country: "United States", country_code: "US", label: "Dallas, TX, USA", display_name: "Dallas, Texas, United States", lat: 32.7767, lon: -96.7970 },
    { city: "Atlanta", state: "GA", country: "United States", country_code: "US", label: "Atlanta, GA, USA", display_name: "Atlanta, Georgia, United States", lat: 33.7490, lon: -84.3880 },
    { city: "Denver", state: "CO", country: "United States", country_code: "US", label: "Denver, CO, USA", display_name: "Denver, Colorado, United States", lat: 39.7392, lon: -104.9903 },
    { city: "Seattle", state: "WA", country: "United States", country_code: "US", label: "Seattle, WA, USA", display_name: "Seattle, Washington, United States", lat: 47.6062, lon: -122.3321 },
    { city: "Spokane", state: "WA", country: "United States", country_code: "US", label: "Spokane, WA, USA", display_name: "Spokane, Washington, United States", lat: 47.6588, lon: -117.4260 },
    { city: "Los Angeles", state: "CA", country: "United States", country_code: "US", label: "Los Angeles, CA, USA", display_name: "Los Angeles, California, United States", lat: 34.0522, lon: -118.2437 },
    { city: "San Francisco", state: "CA", country: "United States", country_code: "US", label: "San Francisco, CA, USA", display_name: "San Francisco, California, United States", lat: 37.7749, lon: -122.4194 },
    { city: "San Diego", state: "CA", country: "United States", country_code: "US", label: "San Diego, CA, USA", display_name: "San Diego, California, United States", lat: 32.7157, lon: -117.1611 },
    { city: "Sacramento", state: "CA", country: "United States", country_code: "US", label: "Sacramento, CA, USA", display_name: "Sacramento, California, United States", lat: 38.5816, lon: -121.4944 },
    { city: "Houston", state: "TX", country: "United States", country_code: "US", label: "Houston, TX, USA", display_name: "Houston, Texas, United States", lat: 29.7604, lon: -95.3698 },
    { city: "Austin", state: "TX", country: "United States", country_code: "US", label: "Austin, TX, USA", display_name: "Austin, Texas, United States", lat: 30.2672, lon: -97.7431 },
    { city: "San Antonio", state: "TX", country: "United States", country_code: "US", label: "San Antonio, TX, USA", display_name: "San Antonio, Texas, United States", lat: 29.4241, lon: -98.4936 },
    { city: "El Paso", state: "TX", country: "United States", country_code: "US", label: "El Paso, TX, USA", display_name: "El Paso, Texas, United States", lat: 31.7619, lon: -106.4850 },
    { city: "New York", state: "NY", country: "United States", country_code: "US", label: "New York, NY, USA", display_name: "New York, New York, United States", lat: 40.7128, lon: -74.0060 },
    { city: "Buffalo", state: "NY", country: "United States", country_code: "US", label: "Buffalo, NY, USA", display_name: "Buffalo, New York, United States", lat: 42.8864, lon: -78.8784 },
    { city: "Albany", state: "NY", country: "United States", country_code: "US", label: "Albany, NY, USA", display_name: "Albany, New York, United States", lat: 42.6526, lon: -73.7562 },
    { city: "Miami", state: "FL", country: "United States", country_code: "US", label: "Miami, FL, USA", display_name: "Miami, Florida, United States", lat: 25.7617, lon: -80.1918 },
    { city: "Orlando", state: "FL", country: "United States", country_code: "US", label: "Orlando, FL, USA", display_name: "Orlando, Florida, United States", lat: 28.5383, lon: -81.3792 },
    { city: "Tampa", state: "FL", country: "United States", country_code: "US", label: "Tampa, FL, USA", display_name: "Tampa, Florida, United States", lat: 27.9506, lon: -82.4572 },
    { city: "Jacksonville", state: "FL", country: "United States", country_code: "US", label: "Jacksonville, FL, USA", display_name: "Jacksonville, Florida, United States", lat: 30.3322, lon: -81.6557 },
    { city: "Kansas City", state: "MO", country: "United States", country_code: "US", label: "Kansas City, MO, USA", display_name: "Kansas City, Missouri, United States", lat: 39.0997, lon: -94.5786 },
    { city: "St. Louis", state: "MO", country: "United States", country_code: "US", label: "St. Louis, MO, USA", display_name: "St. Louis, Missouri, United States", lat: 38.6270, lon: -90.1994 },
    { city: "Minneapolis", state: "MN", country: "United States", country_code: "US", label: "Minneapolis, MN, USA", display_name: "Minneapolis, Minnesota, United States", lat: 44.9778, lon: -93.2650 },
    { city: "Duluth", state: "MN", country: "United States", country_code: "US", label: "Duluth, MN, USA", display_name: "Duluth, Minnesota, United States", lat: 46.7867, lon: -92.1005 },
    { city: "Indianapolis", state: "IN", country: "United States", country_code: "US", label: "Indianapolis, IN, USA", display_name: "Indianapolis, Indiana, United States", lat: 39.7684, lon: -86.1581 },
    { city: "Memphis", state: "TN", country: "United States", country_code: "US", label: "Memphis, TN, USA", display_name: "Memphis, Tennessee, United States", lat: 35.1495, lon: -90.0490 },
    { city: "Nashville", state: "TN", country: "United States", country_code: "US", label: "Nashville, TN, USA", display_name: "Nashville, Tennessee, United States", lat: 36.1627, lon: -86.7816 },
    { city: "Knoxville", state: "TN", country: "United States", country_code: "US", label: "Knoxville, TN, USA", display_name: "Knoxville, Tennessee, United States", lat: 35.9606, lon: -83.9207 },
    { city: "Phoenix", state: "AZ", country: "United States", country_code: "US", label: "Phoenix, AZ, USA", display_name: "Phoenix, Arizona, United States", lat: 33.4484, lon: -112.0740 },
    { city: "Tucson", state: "AZ", country: "United States", country_code: "US", label: "Tucson, AZ, USA", display_name: "Tucson, Arizona, United States", lat: 32.2226, lon: -110.9747 },
    { city: "Flagstaff", state: "AZ", country: "United States", country_code: "US", label: "Flagstaff, AZ, USA", display_name: "Flagstaff, Arizona, United States", lat: 35.1983, lon: -111.6513 },
    { city: "Detroit", state: "MI", country: "United States", country_code: "US", label: "Detroit, MI, USA", display_name: "Detroit, Michigan, United States", lat: 42.3314, lon: -83.0458 },
    { city: "Grand Rapids", state: "MI", country: "United States", country_code: "US", label: "Grand Rapids, MI, USA", display_name: "Grand Rapids, Michigan, United States", lat: 42.9634, lon: -85.6681 },
    { city: "Birmingham", state: "AL", country: "United States", country_code: "US", label: "Birmingham, AL, USA", display_name: "Birmingham, Alabama, United States", lat: 33.5186, lon: -86.8104 },
    { city: "Mobile", state: "AL", country: "United States", country_code: "US", label: "Mobile, AL, USA", display_name: "Mobile, Alabama, United States", lat: 30.6954, lon: -88.0399 },
    { city: "Anchorage", state: "AK", country: "United States", country_code: "US", label: "Anchorage, AK, USA", display_name: "Anchorage, Alaska, United States", lat: 61.2181, lon: -149.9003 },
    { city: "Little Rock", state: "AR", country: "United States", country_code: "US", label: "Little Rock, AR, USA", display_name: "Little Rock, Arkansas, United States", lat: 34.7465, lon: -92.2896 },
    { city: "Hartford", state: "CT", country: "United States", country_code: "US", label: "Hartford, CT, USA", display_name: "Hartford, Connecticut, United States", lat: 41.7658, lon: -72.6734 },
    { city: "Wilmington", state: "DE", country: "United States", country_code: "US", label: "Wilmington, DE, USA", display_name: "Wilmington, Delaware, United States", lat: 39.7447, lon: -75.5484 },
    { city: "Honolulu", state: "HI", country: "United States", country_code: "US", label: "Honolulu, HI, USA", display_name: "Honolulu, Hawaii, United States", lat: 21.3069, lon: -157.8583 },
    { city: "Boise", state: "ID", country: "United States", country_code: "US", label: "Boise, ID, USA", display_name: "Boise, Idaho, United States", lat: 43.6150, lon: -116.2023 },
    { city: "Des Moines", state: "IA", country: "United States", country_code: "US", label: "Des Moines, IA, USA", display_name: "Des Moines, Iowa, United States", lat: 41.5868, lon: -93.6250 },
    { city: "Wichita", state: "KS", country: "United States", country_code: "US", label: "Wichita, KS, USA", display_name: "Wichita, Kansas, United States", lat: 37.6872, lon: -97.3301 },
    { city: "Topeka", state: "KS", country: "United States", country_code: "US", label: "Topeka, KS, USA", display_name: "Topeka, Kansas, United States", lat: 39.0473, lon: -95.6752 },
    { city: "Louisville", state: "KY", country: "United States", country_code: "US", label: "Louisville, KY, USA", display_name: "Louisville, Kentucky, United States", lat: 38.2527, lon: -85.7585 },
    { city: "Lexington", state: "KY", country: "United States", country_code: "US", label: "Lexington, KY, USA", display_name: "Lexington, Kentucky, United States", lat: 38.0406, lon: -84.5037 },
    { city: "New Orleans", state: "LA", country: "United States", country_code: "US", label: "New Orleans, LA, USA", display_name: "New Orleans, Louisiana, United States", lat: 29.9511, lon: -90.0715 },
    { city: "Baton Rouge", state: "LA", country: "United States", country_code: "US", label: "Baton Rouge, LA, USA", display_name: "Baton Rouge, Louisiana, United States", lat: 30.4515, lon: -91.1871 },
    { city: "Shreveport", state: "LA", country: "United States", country_code: "US", label: "Shreveport, LA, USA", display_name: "Shreveport, Louisiana, United States", lat: 32.5252, lon: -93.7502 },
    { city: "Portland", state: "ME", country: "United States", country_code: "US", label: "Portland, ME, USA", display_name: "Portland, Maine, United States", lat: 43.6591, lon: -70.2568 },
    { city: "Baltimore", state: "MD", country: "United States", country_code: "US", label: "Baltimore, MD, USA", display_name: "Baltimore, Maryland, United States", lat: 39.2904, lon: -76.6122 },
    { city: "Boston", state: "MA", country: "United States", country_code: "US", label: "Boston, MA, USA", display_name: "Boston, Massachusetts, United States", lat: 42.3601, lon: -71.0589 },
    { city: "Jackson", state: "MS", country: "United States", country_code: "US", label: "Jackson, MS, USA", display_name: "Jackson, Mississippi, United States", lat: 32.2988, lon: -90.1848 },
    { city: "Billings", state: "MT", country: "United States", country_code: "US", label: "Billings, MT, USA", display_name: "Billings, Montana, United States", lat: 45.7833, lon: -108.5007 },
    { city: "Missoula", state: "MT", country: "United States", country_code: "US", label: "Missoula, MT, USA", display_name: "Missoula, Montana, United States", lat: 46.8721, lon: -113.9940 },
    { city: "Omaha", state: "NE", country: "United States", country_code: "US", label: "Omaha, NE, USA", display_name: "Omaha, Nebraska, United States", lat: 41.2565, lon: -95.9345 },
    { city: "Lincoln", state: "NE", country: "United States", country_code: "US", label: "Lincoln, NE, USA", display_name: "Lincoln, Nebraska, United States", lat: 40.8136, lon: -96.7026 },
    { city: "Las Vegas", state: "NV", country: "United States", country_code: "US", label: "Las Vegas, NV, USA", display_name: "Las Vegas, Nevada, United States", lat: 36.1699, lon: -115.1398 },
    { city: "Reno", state: "NV", country: "United States", country_code: "US", label: "Reno, NV, USA", display_name: "Reno, Nevada, United States", lat: 39.5296, lon: -119.8138 },
    { city: "Manchester", state: "NH", country: "United States", country_code: "US", label: "Manchester, NH, USA", display_name: "Manchester, New Hampshire, United States", lat: 42.9956, lon: -71.4548 },
    { city: "Newark", state: "NJ", country: "United States", country_code: "US", label: "Newark, NJ, USA", display_name: "Newark, New Jersey, United States", lat: 40.7357, lon: -74.1724 },
    { city: "Albuquerque", state: "NM", country: "United States", country_code: "US", label: "Albuquerque, NM, USA", display_name: "Albuquerque, New Mexico, United States", lat: 35.0844, lon: -106.6504 },
    { city: "Charlotte", state: "NC", country: "United States", country_code: "US", label: "Charlotte, NC, USA", display_name: "Charlotte, North Carolina, United States", lat: 35.2271, lon: -80.8431 },
    { city: "Raleigh", state: "NC", country: "United States", country_code: "US", label: "Raleigh, NC, USA", display_name: "Raleigh, North Carolina, United States", lat: 35.7796, lon: -78.6382 },
    { city: "Fargo", state: "ND", country: "United States", country_code: "US", label: "Fargo, ND, USA", display_name: "Fargo, North Dakota, United States", lat: 46.8772, lon: -96.7898 },
    { city: "Bismarck", state: "ND", country: "United States", country_code: "US", label: "Bismarck, ND, USA", display_name: "Bismarck, North Dakota, United States", lat: 46.8083, lon: -100.7837 },
    { city: "Columbus", state: "OH", country: "United States", country_code: "US", label: "Columbus, OH, USA", display_name: "Columbus, Ohio, United States", lat: 39.9612, lon: -82.9988 },
    { city: "Cleveland", state: "OH", country: "United States", country_code: "US", label: "Cleveland, OH, USA", display_name: "Cleveland, Ohio, United States", lat: 41.4993, lon: -81.6944 },
    { city: "Cincinnati", state: "OH", country: "United States", country_code: "US", label: "Cincinnati, OH, USA", display_name: "Cincinnati, Ohio, United States", lat: 39.1031, lon: -84.5120 },
    { city: "Oklahoma City", state: "OK", country: "United States", country_code: "US", label: "Oklahoma City, OK, USA", display_name: "Oklahoma City, Oklahoma, United States", lat: 35.4676, lon: -97.5164 },
    { city: "Tulsa", state: "OK", country: "United States", country_code: "US", label: "Tulsa, OK, USA", display_name: "Tulsa, Oklahoma, United States", lat: 36.1540, lon: -95.9928 },
    { city: "Portland", state: "OR", country: "United States", country_code: "US", label: "Portland, OR, USA", display_name: "Portland, Oregon, United States", lat: 45.5152, lon: -122.6784 },
    { city: "Philadelphia", state: "PA", country: "United States", country_code: "US", label: "Philadelphia, PA, USA", display_name: "Philadelphia, Pennsylvania, United States", lat: 39.9526, lon: -75.1652 },
    { city: "Pittsburgh", state: "PA", country: "United States", country_code: "US", label: "Pittsburgh, PA, USA", display_name: "Pittsburgh, Pennsylvania, United States", lat: 40.4406, lon: -79.9959 },
    { city: "Providence", state: "RI", country: "United States", country_code: "US", label: "Providence, RI, USA", display_name: "Providence, Rhode Island, United States", lat: 41.8240, lon: -71.4128 },
    { city: "Charleston", state: "SC", country: "United States", country_code: "US", label: "Charleston, SC, USA", display_name: "Charleston, South Carolina, United States", lat: 32.7765, lon: -79.9311 },
    { city: "Sioux Falls", state: "SD", country: "United States", country_code: "US", label: "Sioux Falls, SD, USA", display_name: "Sioux Falls, South Dakota, United States", lat: 43.5446, lon: -96.7311 },
    { city: "Rapid City", state: "SD", country: "United States", country_code: "US", label: "Rapid City, SD, USA", display_name: "Rapid City, South Dakota, United States", lat: 44.0805, lon: -103.2310 },
    { city: "Salt Lake City", state: "UT", country: "United States", country_code: "US", label: "Salt Lake City, UT, USA", display_name: "Salt Lake City, Utah, United States", lat: 40.7608, lon: -111.8910 },
    { city: "Burlington", state: "VT", country: "United States", country_code: "US", label: "Burlington, VT, USA", display_name: "Burlington, Vermont, United States", lat: 44.4759, lon: -73.2121 },
    { city: "Richmond", state: "VA", country: "United States", country_code: "US", label: "Richmond, VA, USA", display_name: "Richmond, Virginia, United States", lat: 37.5407, lon: -77.4360 },
    { city: "Norfolk", state: "VA", country: "United States", country_code: "US", label: "Norfolk, VA, USA", display_name: "Norfolk, Virginia, United States", lat: 36.8508, lon: -76.2859 },
    { city: "Charleston", state: "WV", country: "United States", country_code: "US", label: "Charleston, WV, USA", display_name: "Charleston, West Virginia, United States", lat: 38.3498, lon: -81.6326 },
    { city: "Milwaukee", state: "WI", country: "United States", country_code: "US", label: "Milwaukee, WI, USA", display_name: "Milwaukee, Wisconsin, United States", lat: 43.0389, lon: -87.9065 },
    { city: "Madison", state: "WI", country: "United States", country_code: "US", label: "Madison, WI, USA", display_name: "Madison, Wisconsin, United States", lat: 43.0731, lon: -89.4012 },
    { city: "Cheyenne", state: "WY", country: "United States", country_code: "US", label: "Cheyenne, WY, USA", display_name: "Cheyenne, Wyoming, United States", lat: 41.1400, lon: -104.8202 },
    { city: "Casper", state: "WY", country: "United States", country_code: "US", label: "Casper, WY, USA", display_name: "Casper, Wyoming, United States", lat: 42.8501, lon: -106.3252 },
    { city: "Washington", state: "DC", country: "United States", country_code: "US", label: "Washington, DC, USA", display_name: "Washington, District of Columbia, United States", lat: 38.9072, lon: -77.0369 },
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
  const [isTyping, setIsTyping] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);
  const internalValueRef = useRef<string>(value || "");

  // Available hubs for current region
  const regionalHubs = useMemo(() => {
    if (country === "ALL") {
      return Object.values(REGIONAL_HUBS).flat();
    }
    return REGIONAL_HUBS[country] || REGIONAL_HUBS["US"];
  }, [country]);

  // Sync internal input value ONLY if prop changes from outside (e.g. reset, swap, or evaluation resolve)
  useEffect(() => {
    if (value !== internalValueRef.current) {
      internalValueRef.current = value;
      setInputValue(value);
      setIsTyping(false);
    }
  }, [value]);

  // Filter local regional hubs instantly based on current query
  const filteredLocalHubs = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return regionalHubs;
    const tokens = q.split(",").map((t) => t.trim()).filter(Boolean);
    return regionalHubs.filter((h) => {
      const hay = `${h.city} ${h.state || ""} ${h.label} ${h.display_name}`.toLowerCase();
      return tokens.every((tok) => hay.includes(tok));
    });
  }, [inputValue, regionalHubs]);

  // Merged suggestions: local hubs first, followed by unique API results
  const combinedSuggestions = useMemo(() => {
    if (!inputValue.trim() || !isTyping) {
      return regionalHubs;
    }
    const localKeys = new Set(filteredLocalHubs.map((h) => `${h.lat.toFixed(2)},${h.lon.toFixed(2)}`));
    const extraApi = apiSuggestions.filter(
      (a) => !localKeys.has(`${a.lat.toFixed(2)},${a.lon.toFixed(2)}`)
    );
    return [...filteredLocalHubs, ...extraApi];
  }, [inputValue, isTyping, regionalHubs, filteredLocalHubs, apiSuggestions]);

  // Debounced search logic for additional geocoded locations across all 50 US states & worldwide
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = inputValue.trim();
    if (!isTyping || !trimmed || trimmed.length < 2) {
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
    }, 200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputValue, country, isTyping]);

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
    internalValueRef.current = selectedText;
    setInputValue(selectedText);
    setIsTyping(false);
    onChange(selectedText, item);
    setIsOpen(false);
    setApiSuggestions([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    internalValueRef.current = nextVal;
    setInputValue(nextVal);
    setIsTyping(true);
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
                internalValueRef.current = "";
                setInputValue("");
                setIsTyping(false);
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
              <span>{inputValue && isTyping ? "Search Results" : `Freight Transport Hubs (${country})`}</span>
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
