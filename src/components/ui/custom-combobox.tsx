"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Option {
  value: string;
  label: string;
}

interface CustomComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  borderless?: boolean;
  disabled?: boolean;
}

export function CustomCombobox({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  className = "",
  borderless = false,
  disabled = false,
}: CustomComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={borderless
          ? `w-full flex items-center justify-between bg-transparent border-0 outline-none text-ink py-1 text-sm font-semibold placeholder:text-mute-text focus:ring-0 text-left ${disabled ? "opacity-50 pointer-events-none cursor-not-allowed" : "cursor-pointer"}`
          : `w-full flex items-center justify-between text-input bg-canvas border border-ink/10 rounded-xl px-4 py-3 font-bold text-sm text-ink hover:border-ink/30 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-left ${disabled ? "opacity-40 pointer-events-none cursor-not-allowed" : "cursor-pointer"}`
        }
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center space-x-1.5 ml-2 shrink-0">
          {value && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-0.5 hover:bg-canvas-soft rounded text-mute-text hover:text-ink transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-mute-text transition-transform duration-200 ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 right-0 mt-2 bg-canvas border border-ink/10 shadow-xl rounded-xl z-50 overflow-hidden flex flex-col max-h-72"
          >
            {/* Search Input Box */}
            <div className="flex items-center px-3 py-2 border-b border-ink/10 bg-canvas-soft/30">
              <Search className="w-4 h-4 text-mute-text mr-2 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent border-0 outline-none text-xs md:text-sm text-ink placeholder-mute-text/70 py-1"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 hover:bg-canvas-soft rounded text-mute-text hover:text-ink cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Options List */}
            <div className="overflow-y-auto max-h-52 py-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs md:text-sm transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-primary-pale text-ink-deep font-extrabold"
                          : "text-body-text hover:bg-canvas-soft/50 hover:text-ink font-bold"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-4 text-xs md:text-sm text-mute-text text-center font-medium">
                  No results found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
