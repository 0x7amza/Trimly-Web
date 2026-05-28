"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Search, X } from "lucide-react";

// ─── Country Data ──────────────────────────────────────────────────────────────
// Format: [flag emoji, dial code, ISO code, country name, min digits, max digits]
// Digit counts are for the national number (excluding country code)
const COUNTRIES: [string, string, string, string, number, number][] = [
  ["🇬🇧", "+44",  "GB", "United Kingdom",   10, 10],
  ["🇺🇸", "+1",   "US", "United States",     10, 10],
  ["🇨🇦", "+1",   "CA", "Canada",            10, 10],
  ["🇫🇷", "+33",  "FR", "France",             9,  9],
  ["🇩🇪", "+49",  "DE", "Germany",            9, 12],
  ["🇪🇸", "+34",  "ES", "Spain",              9,  9],
  ["🇮🇹", "+39",  "IT", "Italy",              9, 11],
  ["🇵🇹", "+351", "PT", "Portugal",           9,  9],
  ["🇳🇱", "+31",  "NL", "Netherlands",        9,  9],
  ["🇧🇪", "+32",  "BE", "Belgium",            8,  9],
  ["🇨🇭", "+41",  "CH", "Switzerland",        9,  9],
  ["🇦🇹", "+43",  "AT", "Austria",            8, 13],
  ["🇸🇪", "+46",  "SE", "Sweden",             7,  9],
  ["🇳🇴", "+47",  "NO", "Norway",             8,  8],
  ["🇩🇰", "+45",  "DK", "Denmark",            8,  8],
  ["🇫🇮", "+358", "FI", "Finland",            7,  9],
  ["🇮🇪", "+353", "IE", "Ireland",            7,  9],
  ["🇵🇱", "+48",  "PL", "Poland",             9,  9],
  ["🇨🇿", "+420", "CZ", "Czech Republic",     9,  9],
  ["🇭🇺", "+36",  "HU", "Hungary",            8,  9],
  ["🇷🇴", "+40",  "RO", "Romania",            9,  9],
  ["🇬🇷", "+30",  "GR", "Greece",            10, 10],
  ["🇹🇷", "+90",  "TR", "Turkey",            10, 10],
  ["🇦🇺", "+61",  "AU", "Australia",          9,  9],
  ["🇳🇿", "+64",  "NZ", "New Zealand",        8,  9],
  ["🇿🇦", "+27",  "ZA", "South Africa",       9,  9],
  ["🇮🇳", "+91",  "IN", "India",             10, 10],
  ["🇵🇰", "+92",  "PK", "Pakistan",          10, 10],
  ["🇧🇩", "+880", "BD", "Bangladesh",        10, 10],
  ["🇨🇳", "+86",  "CN", "China",             11, 11],
  ["🇯🇵", "+81",  "JP", "Japan",             10, 11],
  ["🇰🇷", "+82",  "KR", "South Korea",       10, 11],
  ["🇸🇦", "+966", "SA", "Saudi Arabia",       9,  9],
  ["🇦🇪", "+971", "AE", "UAE",               9,  9],
  ["🇶🇦", "+974", "QA", "Qatar",              8,  8],
  ["🇰🇼", "+965", "KW", "Kuwait",             8,  8],
  ["🇳🇬", "+234", "NG", "Nigeria",           10, 10],
  ["🇬🇭", "+233", "GH", "Ghana",              9,  9],
  ["🇰🇪", "+254", "KE", "Kenya",              9,  9],
  ["🇪🇬", "+20",  "EG", "Egypt",             10, 10],
  ["🇲🇦", "+212", "MA", "Morocco",            9,  9],
  ["🇧🇷", "+55",  "BR", "Brazil",            10, 11],
  ["🇲🇽", "+52",  "MX", "Mexico",            10, 10],
  ["🇦🇷", "+54",  "AR", "Argentina",         10, 10],
  ["🇨🇴", "+57",  "CO", "Colombia",          10, 10],
  ["🇷🇺", "+7",   "RU", "Russia",            10, 10],
  ["🇺🇦", "+380", "UA", "Ukraine",            9,  9],
];

export interface PhoneInputProps {
  value: string; // E.164 formatted full number, e.g. +447911123456
  onChange: (value: string) => void;
  onValidChange?: (isValid: boolean) => void;
  className?: string;
  required?: boolean;
  id?: string;
}

export default function PhoneInput({ value, onChange, onValidChange, className = "", required, id }: PhoneInputProps) {
  // Parse the current value to determine selected country + national number
  const parseValue = useCallback((val: string) => {
    for (const [flag, dialCode, iso, name, min, max] of COUNTRIES) {
      if (val.startsWith(dialCode)) {
        return {
          country: { flag, dialCode, iso, name, min, max },
          nationalNumber: val.slice(dialCode.length).replace(/\D/g, ""),
        };
      }
    }
    return {
      country: { flag: "🇬🇧", dialCode: "+44", iso: "GB", name: "United Kingdom", min: 10, max: 10 },
      nationalNumber: "",
    };
  }, []);

  const parsed = parseValue(value || "");
  const [selectedCountry, setSelectedCountry] = useState(parsed.country);
  const [nationalNumber, setNationalNumber] = useState(parsed.nationalNumber);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [touched, setTouched] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Keep parent in sync
  useEffect(() => {
    const fullNumber = nationalNumber ? `${selectedCountry.dialCode}${nationalNumber}` : "";
    onChange(fullNumber);
    const isValid = nationalNumber.length >= selectedCountry.min && nationalNumber.length <= selectedCountry.max;
    onValidChange?.(nationalNumber.length > 0 ? isValid : false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry, nationalNumber]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [isOpen]);

  const filteredCountries = COUNTRIES.filter(([, , iso, name]) => {
    const q = searchQuery.toLowerCase();
    return name.toLowerCase().includes(q) || iso.toLowerCase().includes(q);
  });

  const handleSelectCountry = (entry: typeof COUNTRIES[number]) => {
    setSelectedCountry({ flag: entry[0], dialCode: entry[1], iso: entry[2], name: entry[3], min: entry[4], max: entry[5] });
    setNationalNumber("");
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleNationalInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    // Limit to max digits for the selected country
    setNationalNumber(digits.slice(0, selectedCountry.max));
    setTouched(true);
  };

  const isValid = nationalNumber.length >= selectedCountry.min && nationalNumber.length <= selectedCountry.max;
  const showError = touched && nationalNumber.length > 0 && !isValid;
  const showSuccess = touched && nationalNumber.length > 0 && isValid;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Input Row */}
      <div
        className={`flex items-stretch border rounded-xl overflow-hidden transition-all shadow-sm bg-canvas ${
          showError
            ? "border-red-400 ring-1 ring-red-200"
            : showSuccess
            ? "border-emerald-400 ring-1 ring-emerald-100"
            : "border-ink/10 focus-within:border-ink"
        }`}
      >
        {/* Country Flag Button */}
        <button
          type="button"
          id={`${id}-country`}
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-1.5 px-3 py-3 bg-canvas-soft hover:bg-canvas border-r border-ink/10 transition-colors cursor-pointer flex-shrink-0 min-w-[88px]"
          aria-label="Select country code"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="text-lg leading-none" role="img" aria-label={selectedCountry.name}>
            {selectedCountry.flag}
          </span>
          <span className="text-xs font-bold text-ink">{selectedCountry.dialCode}</span>
          <ChevronDown
            className={`w-3 h-3 text-mute-text transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* National Number Input */}
        <input
          type="tel"
          id={id}
          inputMode="numeric"
          placeholder={`${"0".repeat(selectedCountry.min)} (${selectedCountry.min}–${selectedCountry.max} digits)`}
          value={nationalNumber}
          onChange={handleNationalInput}
          onBlur={() => setTouched(true)}
          required={required}
          autoComplete="tel-national"
          className="flex-grow bg-transparent py-3 px-3 text-sm font-bold text-ink placeholder:text-mute-text/50 focus:outline-none"
        />

        {/* Validation indicator */}
        {nationalNumber.length > 0 && (
          <div className="flex items-center pr-3 flex-shrink-0">
            {showSuccess ? (
              <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            ) : showError ? (
              <button
                type="button"
                onClick={() => { setNationalNumber(""); setTouched(false); }}
                className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-red-500 hover:bg-red-200 transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Validation message */}
      {showError && (
        <p className="text-[10px] font-bold text-red-500 mt-1 ml-1">
          {selectedCountry.name} numbers require {selectedCountry.min === selectedCountry.max
            ? `exactly ${selectedCountry.min} digits`
            : `${selectedCountry.min}–${selectedCountry.max} digits`
          }. You entered {nationalNumber.length}.
        </p>
      )}

      {/* Country Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Select country"
          className="absolute top-full left-0 mt-1.5 z-50 bg-canvas border border-ink/10 shadow-2xl rounded-xl overflow-hidden w-72"
        >
          {/* Search bar */}
          <div className="p-2 border-b border-ink/5">
            <div className="flex items-center gap-2 bg-canvas-soft rounded-lg px-3 py-2">
              <Search className="w-3.5 h-3.5 text-mute-text flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs font-bold text-ink focus:outline-none flex-grow placeholder:text-mute-text/60"
              />
            </div>
          </div>

          {/* Country list */}
          <div className="max-h-56 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="py-4 text-center text-xs text-mute-text font-bold">No countries found</div>
            ) : (
              filteredCountries.map(([flag, dialCode, iso, name, min, max]) => (
                <button
                  key={iso}
                  type="button"
                  role="option"
                  aria-selected={selectedCountry.iso === iso}
                  onClick={() => handleSelectCountry([flag, dialCode, iso, name, min, max])}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-primary-pale transition-colors cursor-pointer ${
                    selectedCountry.iso === iso ? "bg-primary-pale" : ""
                  }`}
                >
                  <span className="text-base leading-none flex-shrink-0">{flag}</span>
                  <span className="text-xs font-bold text-ink flex-grow truncate">{name}</span>
                  <span className="text-[10px] font-bold text-mute-text flex-shrink-0">{dialCode}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
